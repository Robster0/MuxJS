//!                                                                             !\\
//*  │‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾│  *\\
//*  │                                                                       │  *\\
//*  │                       For more information visit:                     │  *\\
//*  │                                                                       │  *\\
//*  │                    https://github.com/Robster0/MuxJS                  │  *\\ 
//*  │                 https://www.npmjs.com/package/muxjs-http              │  *\\
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

    #static
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
        this.#static = { name: '', path: '',  content: [] }
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
                    if(this.#origins[i] === r.Headers.Origin)
                    {
                        w.SetHeaders({
                            'Access-Control-Allow-Origin': r.Headers.Origin
                        })
                    }
                }
            }
    
            if(r.Method === "OPTIONS" && this.#preflight !== null)
                return this.#preflight(w, r)
    
    
            if(this.#static.content.length > 0)
                this.#FolderTraversal(this.#static.path, '/' + this.#static.name);
    
                    
            for(let i = 0; i<this.#static.content.length; i++)
            {
                if(this.#static.content[i].urlpath !== r.Url) continue;
                
                return w.SendFile(this.#static.content[i].path)
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
    * Dynamically load static assets when the client requests them
    * @param {string} path path to the static folder
    */
    FileServer(path) {
        try
        {
            if(typeof path !== 'string') throw new TypeError(`Path argument is of wrong type, expected string but is ${typeof path}`);

            this.#static = { name: '', path: '', content: [] }

            const getFolder = path.split('/')
            const folder = getFolder[getFolder.length - 1];


            this.#static.name = folder;
            this.#static.path = path;
            
            this.#FolderTraversal(path, '/' + folder);
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
     
    #FolderTraversal(path, urlpath = "") {
        try
        {        
            fs.readdir(path, (err, files) => {
                if(err) throw err;
                
                for(let i = 0; i<files.length; i++)
                {
                    const newpath = path + "/" + files[i];

                    if(fs.lstatSync(newpath).isDirectory()) {
                        this.#FolderTraversal(newpath, urlpath + "/" + files[i])
                    } else {
                        this.#static.content.push({path: newpath, urlpath: urlpath + "/" + files[i]});
                    }           
                }
            })
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