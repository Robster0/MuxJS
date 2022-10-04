class Router {

    #pathPrefix
    #handlers
    #middleware
    constructor(handler, middleware, path = '') {
       this.#pathPrefix = path;
       this.#handlers = handler
       this.#middleware = middleware
    }

    /**
    * Creates a subroute. Subroute will inherit the prefix path from the parent
    * @param {string} path prefix path 
    */
    SubRouter() {
        return new Router(this.#handlers, this.#middleware, this.#pathPrefix);
    }


    /**
    * Set a prefixed path for this route and all its subroutes routes
    * @param {string} path prefix path 
    */
    PathPrefix(path) {
        try
        {
            if(typeof path !== 'string') throw `err: path parameter is of wrong type, expected string but is ${typeof path}`
            
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
    Use(middleware, path = "*") {
       try 
       {
           if(typeof path !== 'string') {
               throw `err: path parameter is of wrong type, expected string but is ${typeof path}`
           }
           if(typeof middleware !== 'function' ) {
               throw `err: middleware parameter is of wrong type, expected function but is ${typeof middleware}`
           }
           this.#middleware.push({path: this.#pathPrefix + path, middleware: middleware})

           return this;
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
                throw `err: path parameter is of wrong type, expected string but is ${typeof url}`
            }
            if(typeof handler !== 'function' ) {
                throw `err: handler parameter is of wrong type, expected function but is ${typeof func}`
            }

            if(this.#handlers[this.#pathPrefix + path] === undefined) this.#handlers[this.#pathPrefix + path] = []
            
            this.#handlers[this.#pathPrefix + path].push({Handler: handler, Method: ''});

            return this;
        }
        catch(err)
        {
           console.log(err)
        }
    }   

    Method(method) {

        let keys = Object.keys(this.#handlers)

        //this.#handlers[keys[keys.length - 1]][this.#handlers[keys[keys.length - 1]].length - 1])

        this.#handlers[keys[keys.length - 1]][this.#handlers[keys[keys.length - 1]].length - 1].Method = method;

    }
}

class Handler
{
    constructor(d) {
        this.d = d;
    }
}

module.exports = Router;