const fs = require('fs')
const Encode = require('../Encode/encode');

class ResponseWriter {

    #writer
    #method
    #headers
    #statusCode
    constructor(writer, method) {
       this.#writer = writer;
       this.#method = method
       this.#headers = '';
       this.#statusCode = null;
    }

    /**
    * Set response headers. Will only be exist for the current request.
    * @param {object} headers
    */
    SetHeaders(headers) {
        try
        {
            if(typeof headers !== 'object') throw new TypeError(`Headers parameter is of wrong type, expected object but is ${typeof headers}`);

            for(const [key, value] of Object.entries(headers)) {
    
                if(this.#headers.match(new RegExp(key)) && key !== 'Set-Cookie') {

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
            if(typeof body !== 'string') throw new TypeError(`Body parameter is of wrong type, expected string but is ${typeof body}`);

            const buffer = Encode.ToBuffer(this.#SetResponse(body))

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
            if(typeof body !== 'object') throw new TypeError(`Body parameter is of wrong type, expected object but is ${typeof body}`);


            this.SetHeaders({
                'Content-Type': 'application/json'
            })

            const buffer = Encode.ToBuffer(this.#SetResponse(JSON.stringify(body)));

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
            if(typeof filepath !== 'string') throw new TypeError(`Filepath parameter is of wrong type, expected string but is ${typeof filepath}`);

            let contentType = ''

            let extension = filepath.split('.')

            switch(extension[extension.length - 1])
            {
                case 'html': case 'htm': case 'htmls': contentType = 'text/html; charset=utf-8'; break;
                case 'css': contentType = 'text/css'; break;
                case 'js': contentType = 'text/javascript'; break;
                case 'ico': contentType = 'image/x-icon'; break;
                case 'png': contentType = 'image/png'; break;
                case 'gif': contentType = 'image/gif'; break;
                case 'jpeg': case 'jpg': contentType = 'image/jpeg'; break;
                case 'bin': contentType = 'application/mac-binary'; break;
                default: contentType = 'text/plain'; 
            }

            const encodingType = contentType.split('/')[0] === 'image' ? 'latin1' : 'utf-8'

            let data = fs.readFileSync(filepath, { encoding: encodingType })

            this.SetHeaders({'Content-Type': contentType})
            this.SetHeaders({'accept-ranges': 'bytes'})

            const res = Encode.ToBuffer(this.#SetResponse(data, true), encodingType);
            
            this.#statusCode = null;

            if(this.#writer.writableFinished) return;
            
            this.#writer.write(res)

            this.#writer.end()
        }
        catch(err)
        {
            console.log(err);
            this.#OnError();
        }
    }

    /**
    * Sends a cookie to the request endpoint
    * @param {string} name name of the cookie
    * @param {string} value value of the cookie
    * @param {object} attributes cookie attributes, default value for the ExpiresIn attribute is 24 hours
    */
    Cookie(name, value, attributes) {
        try
        {
            if(typeof name !== 'string')throw new TypeError(`name parameter is of wrong type, expected string but is ${typeof name}`);

            if(typeof value !== 'string')throw new TypeError(`value parameter is of wrong type, expected string but is ${typeof value}`);
    
            if(typeof attributes !== 'object')throw new TypeError(`attributes parameter is of wrong type, expected object but is ${typeof attributes}`);

            let cookie = name+'='+(attributes.base64 ? btoa(value) : value)

            //Attributes
            if(typeof attributes.ExpiresIn === 'number')
                cookie += `; Expires=${new Date(Date.now() + attributes.ExpiresIn).toUTCString()}`
            else 
                cookie += `; Expires=${new Date(Date.now() + 1000 * 60 * 60 * 24).toUTCString()}`
    
            if(typeof attributes.HttpOnly === 'boolean' && attributes.HttpOnly)
                cookie += '; HttpOnly'
            if(typeof attributes.Secure === 'boolean' && attributes.Secure)
                cookie += '; Secure'
    
            if(typeof attributes.Domain === 'string')
                cookie += '; Domain='+attributes.Domain

            switch(attributes?.SameSite?.toLowerCase()) 
            {
                case 'strict':
                    cookie += '; SameSite=Strict'
                    break;
                case 'lax':
                    cookie += '; SameSite=Lax'
                    break;
                case 'none':
                    cookie += '; SameSite=None'
                    break;
            }
                
            cookie += '; Path='+(attributes.Path ?? '/')
            cookie += '; SameSite='+(attributes.SameSite ?? 'None')

            this.SetHeaders({
                'Set-Cookie': cookie
            })     
        }
        catch(err)
        {
            console.log(err)
        }
    }

    /**
    * Removes a cookie
    * @param {string} name name of the cookie
    * @param {object} attributes cookie attributes
    */
    ClearCookie(name) {
        if(typeof name !== 'string')throw new TypeError(`name parameter is of wrong type, expected string but is ${typeof name}`);

        let cookie = `${name}=; Expires=${new Date(0).toUTCString()}`

        this.SetHeaders({
            'Set-Cookie': cookie
        })
    }

    /**
    * Sends only a status code back to the request endpoint
    * @param {number} code 
    */
    SendStatus(code) {
        try
        {
            if(typeof code !== 'number') throw new TypeError(`Code parameter is of wrong type, expected number but is ${typeof contentType}`);

            this.#statusCode = code;

            const buffer = Encode.ToBuffer(this.#SetResponse(''))

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
            if(typeof code !== 'number') throw new TypeError(`Code parameter is of wrong type, expected number but is ${typeof contentType}`);

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
            if(typeof path !== 'string') throw new TypeError(`Path parameter is of wrong type, expected string but is ${typeof path}`);


            this.SetHeaders({
                'Location': path
            })

            this.#statusCode = 303;
            const buffer = Encode.ToBuffer(this.#SetResponse(''))

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
            const res = Encode.ToBuffer(this.#SetResponse(''));
            this.#statusCode = null;
            this.#writer.write(res)
            this.#writer.end();
        }
        catch(err)
        {
            console.log(err)
        }
    }

    #SetResponse(body, buf = false) {
        try
        {   
            let response_header = ``

            response_header += `HTTP/1.1 ${!this.#statusCode ? 200 : this.#statusCode}\r\n`
            response_header += `Date: ${new Date().toUTCString()}\r\n`
            response_header += 'X-Powered-By: MuxJS\r\n'
            response_header += `Connection: keep-alive\r\n`
            response_header += `Content-Length: ${buf ? body.length : Encode.ToBuffer(body).length}\r\n`
            response_header += this.#headers

            if(this.#method !== 'HEAD')
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