//!                                                                             !\\
//*  │‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾│  *\\
//*  │                                                                       │  *\\
//*  │                      For more information visit:                      │  *\\
//*  │                                                                       │  *\\
//*  │               https://www.npmjs.com/package/muxjs-http                │  *\\ 
//*  │       https://github.com/Robster0/MuxJS/tree/beta/demonstration       │  *\\
//*  │                                                                       │  *\\
//*  │_______________________________________________________________________│  *\\
//!                                                                             !\\

const net = require('net');
const fs = require('fs');

const ResponseWriter = require('./HTTP/responsewriter')
const Request = require('./HTTP/request')
const parseHeaders = require('./Parse/headers')

const Router = require('./Router/router')
const Middleware = require('./Middleware/middleware')
//URL
const { ParamParser, QueryStrings } = require('./Parse/url');

//Helpers
const { substr } = require('./Parse/helpers')

//BodyParsers
const { getBody, parseJson } = require('./Parse/body')
const { MultiPartFormData, Files } = require('./Parse/Files/parseFile');
const parseUrlEncoded = require('./Parse/urlencoded')
const XmlParser = require('./Parse/Files/parseXml');
const CookieParser = require('./Parse/cookie')

class MuxJS 
{
    #handlers
    #middleware
    #deployedresources
    #notFoundHandlers

    #headers
    #options
    #origins

    #fileServer
    #preflight
    #root
    #socket
  
    constructor() {
  
        //handlers and middlewares
        this.#handlers = []
        this.#middleware = []
        this.#deployedresources = []
        this.#notFoundHandlers = {}

        //Set headers
        this.#headers = {}

        //Options
        this.#options = {
            FileUpload: {
                limit: -1,
                output: 'buffer'
            },
            RawProperty: false 
        }

        //Allowed origins
        this.#origins = []

        //Static folders and information
        this.#fileServer = []
        this.#preflight = null;

        this.Port = undefined;
        this.#root = false;
        this.#socket = null;
    }

    /**
    * returns a new router
    */
    NewRouter() {
        try
        {
            if(this.#root) throw "Only one root router is allowed to be initialized"

            this.#root = true;

            return new Router(this.#handlers, this.#middleware, this.#notFoundHandlers)
        }
        catch(err)
        {
            console.log(err);
        }
    } 

    /**
    * Returns callback function
    * opens a server on a specified port.
    * @param {number} port port
    * @param {function} callback callback function for error checking.
    */
    ListenAndServe(port, callback = null) {
      try
      {
        net.createServer(async (sock) => {
          //Declare ResponseWriter and Request 
          let w;
          let r;

          let body_buffers = []
          let length = 0;

          sock.setMaxListeners(0)

          
          sock.on('data', (chunk) => {
            try
            {
                if(r === undefined) {

                    const parsedHeaders = parseHeaders(chunk)

                    r = new Request(parsedHeaders);
                    w = new ResponseWriter(sock, r.Method);
                    this.#socket = sock

                    body_buffers.push(getBody(chunk));

                } else
                    body_buffers.push(chunk);
                
                length += body_buffers[body_buffers.length - 1].length

                if(length === r.Headers['Content-Length'] || r.Headers['Content-Length'] === undefined)
                    this.#HandleResponse(w, r, Buffer.concat(body_buffers));                 
            }
            catch(err)
            {
                console.log(err);
            }
          });

        }).listen(port);

        this.Port = port;
  
        return callback === null ?  null : callback(null)
      }
      catch(err)
      {
          console.log(err);
          return callback === null ?  null : callback(err)
      }
    }

    #HandleResponse(w, r, body) {
        try
        {
            w.SetHeaders(this.#headers)
            r.Options = this.#options
            r.Method !== 'GET' && (r.Raw = body)

            if(r.Headers?.Origin)
            {
                for(let i = 0; i<this.#origins.length; i++)
                {
                    if(this.#origins[i] !== r.Headers.Origin) continue

                    
                    w.SetHeaders({
                        'Access-Control-Allow-Origin': r.Headers.Origin
                    })
                }

                const methods = this.#headers['Access-Control-Allow-Methods']?.split(', ')

                if(!methods) return w.SendStatus(405)
                
                let allowed = false

                for(let i = 0; i<methods.length; i++)
                    if(methods[i] === r.Method)
                        allowed = true

                if(!allowed) return w.SendStatus(405)
            }
    
            if(r.Method === "OPTIONS" && this.#preflight !== null)
                return this.#preflight(w, r)
    
    
            for(let i = 0; i<this.#fileServer.length; i++)
                if(r.Url.substring(1, this.#fileServer[i].root.length + 1) === this.#fileServer[i].root) {
                    
                    if(!fs.existsSync(this.#fileServer[i].path + r.Url)) continue 

                    return w.SendFile(this.#fileServer[i].path + r.Url)
                }
                    

            
    
            const url = r.Url.split('?');    
            let concluding_handlerPATH = '*';


            //Parse
            for(const key of Object.keys(this.#handlers)) {
                
                if(key === url[0]) {
                    concluding_handlerPATH = key;
                    break;
                } 

                const params = ParamParser(url[0], key);
        
                if(params === null) continue;
        
                r.Params = params;
                concluding_handlerPATH = key;
                break;  
            }
            
            if(url.length > 1) {
                const queries = QueryStrings(url[1])
            
                if(queries !== null) {
                    r.Query = queries;
                } else {
                    return console.log("Invalid query string")
                }
            }


            for(let i = 0; i<this.#deployedresources.length; i++)
                this.#deployedresources[i](w, r)
            
            //Apply options (currently only one...)
            this.#ApplyOptions(r)

            //handlers
            for(let i = 0; i<this.#handlers[concluding_handlerPATH]?.length; i++)
            {
                if(this.#handlers[concluding_handlerPATH][i].Method !== r.Method && this.#handlers[concluding_handlerPATH][i].Method !== '') continue;
                
                const handler = this.#handlers[concluding_handlerPATH][i].Handler
    
                const mw = new Middleware(this.#middleware, this.#socket, concluding_handlerPATH, handler)
                
                return mw.Serve(w, r)
            }

            this.#HandleNotFoundHandlers(w, r)
        }
        catch(err)
        {
            console.log(err);
        }
    }


    /**
    * Deploy third party resources or built in MuxJS body parsers
    * @param {function} handler 
    */
    Deploy(handler) {
        if(typeof handler !== 'function') throw new TypeError(`Handler argument is of wrong type, expected function but is ${typeof handler}`)

        this.#deployedresources.push(handler)
    }

    /**
    * Change Access-Control-Allow-Origin header
    * @param {object} CORSObject takes in a object of keys origin, methods and credentials
    */
    CORS(CORSObject) {
        try
        {

            if(typeof CORSObject !== "object") throw new TypeError(`CORSObject argument is of wrong type, expected object but is ${typeof CORSObject}`)



            if(CORSObject?.origins)
                this.#origins = CORSObject.origins

            if(CORSObject?.credentials)
                this.#headers['Access-Control-Allow-Credentials'] = CORSObject.credentials;

            if(CORSObject?.methods)
                this.#headers['Access-Control-Allow-Methods'] = CORSObject.methods;

            if(CORSObject?.headers)
               this.#headers['Access-Control-Allow-Headers'] = CORSObject.headers;

        }
        catch(err)
        {
           console.log(err);
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
            if(typeof handler !== 'function') throw new TypeError(`Handler argument is of wrong type, expected function but is ${typeof handler}`);

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
            if(typeof headers !== "object") throw new TypeError(`Headers argument is of wrong type, expected object but is ${typeof headers}`);

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
    * Dynamically serve static assets when the client requests them
    * @param {string} root name of the folder, e.g. "static" or "public"
    * @param {string} parent path to the directory of the 'root' argument,
    * should only be added if the file calling this function isn't relative to the target directory
    */
    FileServer(root, parent = require.main.path) {
        try
        {
            if(typeof root !== 'string') throw new TypeError(`Root argument is of wrong type, expected string but is ${typeof root}`);

            if(typeof parent !== 'string') throw new TypeError(`Parent argument is of wrong type, expected string but is ${typeof parent}`);
               
            this.#fileServer.push({root, path: parent})
        }
        catch(err)
        {
            console.log(err);
        }
    }  

    /** 
    * Set options 
    * 
    * e.g., output format and size limit for fileuploads
    * @param {string} path path to the static folder
    */
    Options(options) {
        try
        {
            if(typeof options !== 'object') throw new TypeError(`Options argument is of wrong type, expected object but is ${typeof options}`);


            this.#options = {...this.#options, ...options}
        }
        catch(err)
        {
            console.log(err)
        }
    }

    #MethodOverride(w, r) {
        if(!r.Query['_method']) return


        r.Query['_method'] = r.Query['_method'].toUpperCase()

        if(r.Query['_method'] !== 'PUT' && r.Query['_method'] !== 'DELETE') return;
        
        r.Method = r.Query['_method']

        delete r.Query['_method']
    }

    #HandleNotFoundHandlers(w, r) {
        if(Object.keys(this.#notFoundHandlers).length < 1) return false;


        let notFoundHandler = [0, this.#notFoundHandlers.root]

        for(let i = 0; i<this.#notFoundHandlers?.sub?.length; i++)
        {
            const path = this.#notFoundHandlers.sub[i].path

            if(path.length > r.Url.length || substr(r.Url, 0, path.length) !== path) continue
            
            if(path.length <= notFoundHandler[0]) continue


            notFoundHandler = [path.length, this.#notFoundHandlers.sub[i].handler]
        }

        return notFoundHandler[1](w, r) ?? false
    }

    #ApplyOptions(r) {
        if(r.Options.RawProperty === false)
            delete r.Raw
    }


    /**
    *  Parses incoming urlencoded data
    * 
    *  nested urlencoded data is allowed
    */
    UrlEncoded = () => parseUrlEncoded 
    /**
    *  Parses incoming multipart data
    */
    MultiPartFormData = () => MultiPartFormData 
    /**
    *  Parses incoming xml data
    * 
    *  NOTE: this xml parser only works with simple xml, complex xml might give you mistakes 
    */
    XmlParser = () => XmlParser 
    /**
    *  Parses incoming json data
    */
    Json = () => parseJson
    /**
    *  Parses incoming binary data into writable files
    */
    FileUpload = () => Files
    /**
    *  Parses incoming cookies
    */
    Cookies = () => CookieParser
    /**
    *  Allows for PUT and DELETE form requests
    */
    MethodOverride = () => this.#MethodOverride
}


module.exports = new MuxJS()