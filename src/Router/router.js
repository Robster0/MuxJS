class Router {
    #root
    #pathPrefix

    #handlers
    #middleware
    #notFoundHandler
    #latestHandler

    #Methods
    constructor(handler, middleware, notFoundHandler, root = true, path = '') {
       this.#root = root
       this.#pathPrefix = path
       this.#handlers = handler
       this.#middleware = middleware
       this.#notFoundHandler = notFoundHandler
       this.#latestHandler = null


       this.#Methods = {
            'GET': true,
            'POST': true,
            'PUT': true,
            'DELETE': true,
            'OPTIONS': true,
            'HEAD': true,
            'CONNECT': false,
            'TRACE': false,
            'PATCH': false
       }
    }

    /**
    * Creates a subroute. Subroute will inherit the prefix path from the parent
    * @param {string} path prefix path 
    */
    SubRouter() {
        return new Router(this.#handlers, this.#middleware, this.#notFoundHandler, false, this.#pathPrefix);
    }

    GetPathPrefix = () => this.#pathPrefix

    /**
    * Set a prefixed path for this route and all its subroutes routes
    * @param {string} path prefix path 
    */
    PathPrefix(path) {
        try
        {
            if(typeof path !== 'string') throw new TypeError(`Path parameter is of wrong type, expected string but is ${typeof path}`);
            
            this.#pathPrefix += path;

            this.public += path;

            return this;
        }
        catch(err)
        {
            console.log(err);
        }
    }



    /**
    * Use middleware handlers
    * @param {function} middleware function that will trigger before all/the specified handler
    * @param {string} path path that the middleware will trigger on, not setting a value will make it trigger on any url 
    */
    Use(middleware, path = '') {
       try 
       {
           if(typeof path !== 'string') {
               throw new TypeError(`Path parameter is of wrong type, expected string but is ${typeof path}`);
           }
           if(typeof middleware !== 'function' ) {
               throw new TypeError(`Middleware parameter is of wrong type, expected function but is ${typeof middleware}`);
           }
           this.#middleware.push({path: this.#pathPrefix + path, middleware: middleware})

           return this;
       }
       catch(err)
       {
           console.log(err)
       }
    }

    NotFoundHandler(handler) {
        try
        {
            if(typeof handler !== 'function' ) 
                throw new TypeError(`Handler parameter is of wrong type, expected function but is ${typeof func}`);

            
            if(this.#root)
                this.#notFoundHandler['root'] = handler
            else {
                if(!this.#notFoundHandler['sub'])
                    this.#notFoundHandler['sub'] = []
                
                this.#notFoundHandler.sub.push({handler: handler, path: this.#pathPrefix})
            }
        }
        catch(err)
        {
            console.log(err)
        }
    }

    /**
    * initializes a handler for a specific path and method
    * @param {string} path url endpoint that the handler function will activate on.
    * @param {function} handler handler function that will get called when the current endpoint matches the route endpoint. request and response parameter.
    * @param {string} method what type of method this handler will activate on, t.ex GET or POST.
    */
    HandleFunc(path, handler) {
        try
        {
            if(typeof path !== 'string') {
                throw new TypeError(`Path parameter is of wrong type, expected string but is ${typeof url}`);
            }
            if(typeof handler !== 'function' ) {
                throw new TypeError(`Handler parameter is of wrong type, expected function but is ${typeof func}`);
            }


            if(path.length === 0 || path[0] !== '/') throw new Error(`Invalid path parameter value`)

            if(this.#handlers[this.#pathPrefix + path] === undefined) this.#handlers[this.#pathPrefix + path] = []
                      
            const handlerData = {Handler: handler, Method: ''}

            this.#handlers[this.#pathPrefix + path].push(handlerData)

            this.#latestHandler = handlerData

            return this;
        }
        catch(err)
        {
           console.log(err)
           return this;
        }
    }   

    Method(method) {

        if(!this.#latestHandler || !this.#Methods[method]) return;

        this.#latestHandler.Method = method;

        this.#latestHandler = null;
    }
}


module.exports = Router;