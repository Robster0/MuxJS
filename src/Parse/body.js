const HexToUTF8 = require('../Encode/decode')

function getBody(bytes)
{
    try
    {
        for(let i = 7; i<bytes.length; i++)
        {
            if(bytes[i] === 13 && bytes[i + 1] === 10 && bytes[i + 2] === 13 && bytes[i + 3] === 10)
            {
                index = i + 4;
                break;
            }
        }
    
        return Buffer.from(bytes.slice(index, bytes.length), 'binary');
    }
    catch(err)
    {
        console.log(err)
    }
}

function parseJson(w, r){
    try
    {
        if(r.Headers['Content-Type'] !== 'application/json') return

        r.Body = JSON.parse(HexToUTF8(r.Raw.toString('utf-8')))
    }
    catch(err)
    {
        w.SendStatus(500)
    }
}




module.exports = { getBody, parseJson }