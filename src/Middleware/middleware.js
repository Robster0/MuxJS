const { undefinedObj, substr } = require('../Parse/helpers')

class Middleware {

    #currExecutableMW
    #socket

    constructor(mw, sock, path = null, handler = null) {

        this.#socket = sock;

        if(path === null) {
            this.#currExecutableMW = mw;
        } else {
            this.#load(mw, path)
            this.#currExecutableMW.push(handler);
        }
    }

    #load(mw, path) {
        try
        {
            this.#currExecutableMW = [];

            for(let i = 0; i<mw.length; i++) {
                if(mw[i].path === path ||
                   mw[i].path.length === 0 ||
                   substr(path, 0, mw[i].path.length) === mw[i].path) {
                    
                    this.#currExecutableMW.push(mw[i].middleware);
                }
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }

    /**
    * Serves the next middleware or handler
    * @param {class} w Passes down the response writer variable to the next handler
    * @param {class} r Passes down the request variable to the next handler
    */
    Serve(w, r) {
        try
        {
            if(this.#currExecutableMW.length < 1) throw new Error("No executable middlewares")
 
            if(!this.#socket.writable) return;
 
            const nextMw = this.#currExecutableMW[0];
            let mwList = []

            for(let i = 1; i<this.#currExecutableMW.length; i++)
            {
                mwList.push(this.#currExecutableMW[i]);
            }

            if(mwList.length !== 0) 
                return nextMw(w, r, new Middleware(mwList, this.#socket))
    
            if(undefinedObj(r.Body) && undefinedObj(r.Files)) {
                const ct = r.Headers['Content-Type']

                if(ct === 'application/json' || ct === 'application/x-www-form-urlencoded') {
                    r.Body = r.Raw.toString('utf-8')
                } else {
                    r.Files['File'] = {
                        data: r.Raw,
                        type: 'Unknown',
                        size: r.Raw?.length
                    }
                }
            }  


            nextMw(w, r)
        }
        catch(err)
        {
           console.log(err)
        }
    }
}

module.exports = Middleware;