class Request {

    constructor(headers) {
        this.Method = headers.Method    
        this.Url = headers.Url
        this.Headers = headers.headers   
 
        this.Params = {}
        this.Query = {} 

        if (this.Method === 'POST') {
            this.Body = {}
            this.Files = {}
        }
    }
}



module.exports = Request;