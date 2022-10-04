const { isRegExp } = require("util/types");

function HandlePOSTRequests(data, r) {
    if(r.Method !== 'POST' || !r.Headers['Content-Type']) return r;

    const contentType = r.Headers['Content-Type'].split('; ')

    switch(contentType[0])
    {
        case 'application/x-www-form-urlencoded':
                r.Body = ParseFormData(data.toString('utf-8').split(/\r\n\r\n/)[1]);
            break;
        case 'application/json':
                r.Body = JSON.parse(data.toString('utf-8').split(/\r\n\r\n/)[1]);
            break;
        case 'multipart/form-data':
                data = data.toString('latin1')

                const boundary = "--" + contentType[1].split('boundary=')[1];

                parseMultipartFormData(data.split(new RegExp(boundary + '--|' + boundary)), r)
            break;
    }
}

function ParseFormData(data) {
    const Body = {}

    data = data.split(/&|=/);

    for(let i = 0; i<data.length; i+=2)
    {
        Body[data[i]] = data[i + 1];
    }

    return Body;
}

function parseMultipartFormData(formdata, r) {
    for(let i = 1; i<formdata.length; i++)
    {
        const sections = formdata[i].split(/\r\n/);

        if(sections.length <= 2) continue;

        if(sections[2].match(/^Content-Type:/)) {

            
            let contentTypes = formdata[i].match(/^Content-Type: .+/gm)[0];

            const data = formdata[i].split(contentTypes)

            let key = data[0].match(/".+?"/g);

            r.Files[key[0].substring(1, key[0].length - 1)] = {
                data: data[1].substring(4).toString('latin1'),
                name: key[1].substring(1, key[1].length - 1)
            }
            continue;
        } 

        const key = sections[1].match(/".+?"/)

       // console.log(sections[1].match(/".+?"/));
        if(r.Body === null) r.Body = {}

        r.Body[key[0].substring(1, key[0].length - 1)] = sections[sections.length - 2];
    }
}


module.exports = HandlePOSTRequests