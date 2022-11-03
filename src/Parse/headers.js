const HexToUTF8 = require('../Encode/decode');
const { pFloat } = require('./helpers')

function parseHeaders(rawHeaders) {
    try
    {
        let request = {}
        request['headers'] = {}

        let headers = rawHeaders.toString('utf-8').split(/\r\n/);

        const request_info = headers[0].split(' ');
    
        request['Url'] = HexToUTF8(request_info[1]);
        request['Method'] = request_info[0]
        request['headers']['Version'] = request_info[request_info.length - 1]
    
        for(let i = 1; i<headers.length; i++)
        {
            if(headers[i] === '') break;

            let [key, value] = headers[i].split(': ')

            if(key === 'Referer' || key === 'Origin') value = HexToUTF8(value)
     
            request['headers'][key] = pFloat(value)
        }

        return request
    }
    catch(err)
    {
        return {
            'Headers': 'Invalid Headers'
        }
    }

}


module.exports = parseHeaders;