const { DecodeToUTF8 } = require('./decode');

function ParamParser(clientpath, routepath) {
    try
    {
        clientpath = DecodeToUTF8(clientpath);

        if(routepath === "/" || !routepath.match(/{\w+}/)) return null;

        routepath = routepath.split("/")
        clientpath = clientpath.split("/")

        if(routepath.length !== clientpath.length) return null;

        const params = {}

        for(let i = 0; i<routepath.length; i++)
        {
            if(routepath[i][0] === "{" && routepath[i][routepath[i].length - 1] === "}") {
                params[routepath[i].split(/{|}/)[1]] = clientpath[i];    
            }
            else if(routepath[i] !== clientpath[i]) return null;
        }

        return params;
    }
    catch(err)
    {
        console.log(err)
        return null;
    }
}

function QueryStrings(query) {
    try
    {
        let queries = {}

        query = DecodeToUTF8(query);

        query = query.split(/&|=/);

        if(query.length % 2 !== 0) return null;

        for(let i = 0; i<query.length; i+=2)
        {
            queries[query[i]] = query[i + 1];
        }


        return queries
    }
    catch(err)
    {
        console.log(err)
        return null;
    }
}


module.exports = { ParamParser, QueryStrings }