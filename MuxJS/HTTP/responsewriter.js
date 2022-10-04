const fs = require('fs')
const Encode = require('../Parse/encode');

class ResponseWriter {

    #writer
    #headers
    #statusCode
    constructor(writer) {
       this.#writer = writer;
       this.#headers = '';
       this.#statusCode = null;
    }

    /**
    * Set response headers. Will only be exist for the current request.
    * @param {string} headers
    */
    SetHeaders(headers) {
        try
        {
            if(typeof headers !== 'object') throw `TypeError: headers parameter is of wrong type, expected object but is ${typeof headers}`

            for(const [key, value] of Object.entries(headers)) {
    
                if(this.#headers.match(new RegExp(key))) {

                    const data = this.#headers.split(/\r\n/).filter(e => e)
                    
                    this.#headers = ``;

                    for(let i = 0; i<data.length; i++)
                    {
                        if(data[i].match(new RegExp(key))) continue;

                        this.#headers += data[i] + '\r\n';
                    }
                };       
                this.#headers += `${key}: ${value}\r\n`;
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }

    /**
    * Sends data to the request endpoint.
    * @param {string} data 
    */
    Send(body) {
        try
        {
            if(typeof body !== 'string') throw `TypeError: body parameter is of wrong type, expected string but is ${typeof body}`

            const buffer = Encode.ToBuffer(this.#SetHeaders(body))

            this.#statusCode = null;
            this.#writer.write(buffer)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err)
            this.#OnError()
        }
    }

    /**
    * Sends json data to the request endpoint.
    * @param {object} data
    */
    SendJSON(body) {
        try
        {
            if(typeof body !== 'object') throw `TypeError: body parameter is of wrong type, expected object but is ${typeof body}`


            this.SetHeaders({
                'Content-Type': 'application/json'
            })

            const buffer = Encode.ToBuffer(this.#SetHeaders(JSON.stringify(body)));

            this.#statusCode = null;
            this.#writer.write(buffer)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err)
            this.#OnError()
        }
    }

    /**
    * Sends a file to the request endpoint
    * @param {string} filepath path to the file you want to upload
    */
    SendFile(filepath) {
        try
        {
            if(typeof filepath !== 'string') throw `TypeError: filepath parameter is of wrong type, expected string but is ${typeof filepath}`

            let contentType = ''

            let extension = filepath.split('.')

            switch(extension[extension.length - 1])
            {
                case 'html': case 'htm': case 'htmls': contentType = 'text/html; charset=utf-8'; break;
                case 'css': contentType = 'text/css'; break;
                case 'js': contentType = 'text/javascript'; break;
                case 'ico': contentType = 'image/x-icon'; break;
                case 'png': contentType = 'image/png'; break;
                case 'jpeg': case 'jpg': contentType = 'image/jpeg'; break;
                case 'bin': contentType = 'application/mac-binary'; break;
                default: contentType = 'text/plain'; 
            }


            fs.readFile(filepath, (err, data) => {
                if(err) throw err;

                this.SetHeaders({'Content-Type': contentType})
                const res = Encode.ToBuffer(this.#SetHeaders(data));
                this.#statusCode = null;
                this.#writer.write(res)
                this.#writer.end();
            })
        }
        catch(err)
        {
            console.log(err);
            this.#OnError();
        }
    }

    /**
    * Sends only a status code back to the request endpoint
    * @param {number} code 
    */
    SendStatus(code) {
        try
        {
            if(typeof code !== 'number') throw `TypeError: code parameter is of wrong type, expected number but is ${typeof contentType}`

            this.#statusCode = code;

            const buffer = Encode.ToBuffer(this.#SetHeaders(''))

            this.#statusCode = null;
            this.#writer.write(buffer)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err)
            this.#OnError()
        }
    }

    /**
    * Sets the status code for the future response
    * @param {number} code 
    */
    Status(code) {
        try
        {
            if(typeof code !== 'number') throw `TypeError: code parameter is of wrong type, expected number but is ${typeof contentType}`

            this.#statusCode = code;
            return this
        }
        catch(err)
        {
            console.log(err)
            this.#OnError()
        }
    }

    /**
    * Redirects the client to the specified endpoint 
    * @param {string} path
    */
    Redirect(path) {
        try
        {
            if(typeof path !== 'string') throw `TypeError: path parameter is of wrong type, expected string but is ${typeof path}`


            this.SetHeaders({
                'Location': path
            })

            this.#statusCode = 303;
            const buffer = Encode.ToBuffer(this.#SetHeaders(''))

            this.#statusCode = null;
            this.#writer.write(buffer)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err);
            this.#OnError();
        }
    }

    #OnError() {
        try
        {
            const res = Encode.ToBuffer(this.#SetHeaders(''));
            this.#statusCode = null;
            this.#writer.write(res)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err)
        }
    }

    #SetHeaders(body) {
        try
        {   
             let response_header = ``
 
             response_header += `HTTP/1.1 ${this.#statusCode === null ? 200 : this.#statusCode}\r\n`
             response_header += `Date: ${new Date().toUTCString()}\r\n`

             response_header += `Connection: keep-alive\r\n`
             response_header += `Content-Length: ${Encode.ToBuffer(body).length}\r\n`

             response_header += this.#headers
             
             response_header += `\r\n${body}`
 
             return response_header;
        }
        catch(err)
        {
            console.log(err);
        }
     }
}

module.exports = ResponseWriter;