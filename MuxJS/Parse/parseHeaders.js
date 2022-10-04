function parseHeaders(req) {
    try
    {
        let data = {}
        data['headers'] = {}
        data['Body'] = {}
        data['Files'] = {}

        let headers = req.toString('utf-8').split(/\r\n/);

        const info = headers[0].split(' ');
    
        data['Url'] = info[1]
        data['Method'] = info[0]
        data['headers']['Version'] = info[info.length - 1]
    
        for(let i = 1; i<headers.length; i++)
        {
            if(headers[i] === '') break;

            const reqheaders = headers[i].split(': ')
    
            if(reqheaders.length < 2) continue;
            
            data['headers'][reqheaders[0]] = reqheaders[1] 
        }

        return data
    }
    catch(err)
    {
        console.log(err)
        return data
    }

}

module.exports = parseHeaders;