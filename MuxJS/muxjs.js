const net = require('net');
const fs = require('fs');
const ResponseWriter = require('./HTTP/responsewriter')
const Request = require('./HTTP/request')
const HandlePOSTRequests = require('./Parse/parseBody')
const parseHeaders = require('./Parse/parseHeaders')
const Router = require('./Router/router')
const Middleware = require('./Middleware/middleware')
const { ParamParser, QueryStrings } = require('./Parse/parseURL')


class MuxJS 
{
    #static
    #handlers
    #middleware
    #headers
    #preflight
  
    constructor() {
  
        //handlers and middlewares
        this.#handlers = []
        this.#middleware = []
  
        //headers
        this.#headers = {} 
        this.#static = { root: '', data: [] }

        this.#preflight = null;
  
        this.Port = undefined;
    }

    /**
    * returns a new router
    */
    NewRouter() {
        return new Router(this.#handlers, this.#middleware)
    }

    /**
    * Returns callback function
    * opens a server on a specified port.
    * @param {number} port port
    * @param {function} callback callback function for error checking.
    */
    ListenAndServe(port, callback) {
      try
      {
        net.createServer(async (sock) => {
          //Declare ResponseWriter and Request 
          let w;
          let r;

          let buffers = []
          let length = 0;
          

          sock.on('data', (chunk) => {
            try
            {

                buffers.push(chunk);
                length += chunk.length;

                if(r === undefined)
                {

                    const parsedHeaders = parseHeaders(chunk)

                    w = new ResponseWriter(sock);
                    r = new Request(parsedHeaders);


                    length -= Buffer.from(chunk.toString('utf-8').split('\r\n\r\n')[0] + "\r\n\r\n", 'utf8').length
                }

                if(length === parseInt(r.Headers['Content-Length']) || r.Headers['Content-Length'] === undefined)
                    this.#Response(w, r, Buffer.concat(buffers));
                
                    
            }
            catch(err)
            {
                console.log(err);
            }
          });

        }).listen(port, '127.0.0.1');




        this.Port = port;
  
  
        return callback(null)
      }
      catch(err)
      {
          console.log(err);
          return callback(err)
      }
    }

    #Response(w, r, data) {

        w.SetHeaders(this.#headers)

                
        for(let i = 0; i<this.#static.data.length; i++)
        {
            if(this.#static.data[i].urlpath !== r.Url) continue;
            
            return w.SendFile(this.#static.data[i].path)
        }

        if(r.Method === "OPTIONS" && this.#preflight !== null)
            return this.#preflight(w, r)
        
        HandlePOSTRequests(data, r);

        const url = r.Url.split('?');    
        let concluding_handlerPATH = "/*";
        
        //Parse
        for(const key of Object.keys(this.#handlers)) {
        
            if(key === url[0]) {
                concluding_handlerPATH = key;
                break;
            } else {
                const params = ParamParser(url[0], key);
        
                if(params === null) continue;
        
                r.Params = params;
                concluding_handlerPATH = key;
                break;
            }
        }
        
        if(url.length > 1) {
            const queries = QueryStrings(url[1])
        
            if(queries !== null) {
                r.Query = queries;
            } else {
                return console.log("Invalid query string")
            }
        }


        if(this.#handlers[concluding_handlerPATH] === undefined)     
            return console.log("No handler for this endpoint");

        
        for(let i = 0; i<this.#handlers[concluding_handlerPATH].length; i++)
        {
            if(this.#handlers[concluding_handlerPATH][i].Method !== r.Method) continue;
                
            
                const handler = this.#handlers[concluding_handlerPATH][i].Handler

                const mw = new Middleware(this.#middleware, concluding_handlerPATH, handler)

                if(mw.count > 0)
                    mw.Serve(w, r)
                else
                    handler(w, r)

        }

    }
    /**
    * Change Access-Control-Allow-Origin header
    * @param {object} CORSObject takes in a object of keys origin, methods and credentials
    */
    CORS(CORSObject) {
        try
        {
            if(typeof CORSObject !== "object") throw `err: allowedOrigins parameter is of wrong type, expected object but is ${typeof CORSObject}`



            if(CORSObject?.origin !== undefined)
              this.#headers['Access-Control-Allow-Origin'] = CORSObject.origin;


            if(CORSObject?.credentials !== undefined)
              this.#headers['Access-Control-Allow-Credentials'] = CORSObject.credentials;

              if(CORSObject?.methods !== undefined)
                this.#headers['Access-Control-Allow-Methods'] = CORSObject.methods;
        }
        catch(err)
        {
           console.log("err: " + err);
        }
    }

    /**
    * Global handler for preflight requests.
    * 
    * ⚠️Attention⚠️
    * 
    * Will make every OPTIONS handler unreachable 
    * @param {function} handler function
    */
    PreFlight(handler) {
       try
       {
            if(typeof handler !== 'function') throw `err: handler parameter is of wrong type, expected function but is ${typeof handler}`

            this.#preflight = handler;
       }
       catch(err)
       {
            console.log(err);
       }
    }
    /**
    * Set response headers globally.
    * @param {object} headers takes in a object that contains the headers    
    */
    Headers(headers) {
       try
       {
            if(typeof headers !== "object") throw `err: headers parameter is of wrong type, expected object but is ${typeof headers}`

            for(const [key, value] of Object.entries(headers)) {
                this.#headers[key] = value;
            }
       }
       catch(err)
       {
          console.log(err);
       }
    }

    /** 
    * Dynamically loads linked files inside html when requested
    * @param {string} path set the Static folder
    */
    Static(path) {
        try
        {
            if(typeof path !== 'string') throw `err: path parameter is of wrong type, expected string but is ${typeof path}`

            const getFolder = path.split('/')
            const folder = getFolder[getFolder.length - 1];
            this.#static.root = folder;
            this.#FolderSearch(path, '/' + folder);
        }
        catch(err)
        {
            console.log(err);
        }
    }     
     
    #FolderSearch(path, urlpath = "") {
        try
        {        
            fs.readdir(path, (err, files) => {
                if(err) throw err;
                
                for(let i = 0; i<files.length; i++)
                {
                    const newpath = path + "/" + files[i];

                    if(fs.lstatSync(newpath).isDirectory()) {
                        this.#FolderSearch(newpath, urlpath + "/" + files[i])
                    } else {
                        this.#static.data.push({path: newpath, urlpath: urlpath + "/" + files[i]});
                    }           
                }
            })
        }
        catch(err)
        {
            console.log(err)
        }
    }
}


module.exports = new MuxJS()