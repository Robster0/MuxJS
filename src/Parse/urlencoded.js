const { pFloat, undefinedObj } = require('./helpers')
const HexToUTF8 = require('../Encode/decode')

function parseUrlEncoded(w, r) {
    try
    {
        if(r.Headers['Content-Type'] !== 'application/x-www-form-urlencoded') return


        const body = r.Raw.toString('utf-8').split(/&|=/);

        for(let i = 0; i<body.length; i+=2) {

            const nested = HexToUTF8(body[i]).split(/\[|\]/).filter(e => e)

            if(nested.length === 1) {
                r.Body[body[i]] = HexToUTF8(pFloat(body[i + 1]))
                continue
            }

            nestedUrlencoded(r.Body, nested, pFloat(body[i + 1]))
        }
    }
    catch(err)
    {
        console.log(err)
        w.SendStatus(500)
    }
}

function nestedUrlencoded(body, keys, value) {
    if(keys.length === 1) return body[keys[0]] = value

    const nextKey = keys[0]
    keys.shift()

    if(!body[nextKey] || Object.keys(body[nextKey]) === 0)
        body[nextKey] = {}


    return nestedUrlencoded(body[nextKey], keys, value)
}

module.exports = parseUrlEncoded
