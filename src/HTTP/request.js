class Request {

    constructor(headers) {
        this.Method = headers.Method    
        this.Url = headers.Url
        this.Headers = headers.headers   
 
        this.Params = {}
        this.Query = {} 
        this.Cookies = {}
        this.Options = {}

        if (this.Method === 'GET') return
        
        this.Body = {}
        this.Files = {}
        this.Raw = ''
    }
}



module.exports = Request;