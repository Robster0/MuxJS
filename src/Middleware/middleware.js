class Middleware {

    #currExecutableMW

    constructor(mw, path = null, handler = null) {
        if(path === null) {
            this.#currExecutableMW = mw;
        } else {
            this.count = 0;       
            this.#load(mw, path, handler)
        }
    }

    #load(mw, path, handler) {
        try
        {
            this.#currExecutableMW = [];

            for(let i = 0; i<mw.length; i++) {
                if(mw[i].path === path || mw[i].path === '*' || this.#subroutemw(path, mw[i].path)) {
                    this.#currExecutableMW.push(mw[i].middleware);
                }
            }
    
            this.#currExecutableMW.push(handler);
            this.count = this.#currExecutableMW.length - 1;
        }
        catch(err)
        {
            console.log(err);
        }
    }

    #subroutemw(path, mwPath) {
        try
        {
            if(mwPath[0] === '*' || mwPath[mwPath.length - 1] !== '*') return false;


            for(let i = 0; i<mwPath.length - 1; i++)
            {
                if(path[i] !== mwPath[i]) return false;
            }

            return true;
        }
        catch(err)
        {
            return false;
        }
    }

     /**
     * Serves the next handler or middleware
     * @param {w} ResponseWriter Passes down the response writer variable to the next handler
     * @param {r} Request Passes down the request variable to the next handler
     */
    Serve(w, r) {
        try
        {
           if(this.#currExecutableMW.length < 1) throw new Error("No executable middlewares")
 
           const next = this.#currExecutableMW[0];
           let updated = []
 
           for(let i = 1; i<this.#currExecutableMW.length; i++)
           {
                updated.push(this.#currExecutableMW[i]);
           }

           if(updated.length === 0)
                next !== null && next(w, r)
            else 
                next(w, r, new Middleware(updated))
        }
        catch(err)
        {
           console.log(err)
        }
    }
}

module.exports = Middleware;