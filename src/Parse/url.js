const { substr, pFloat } = require('./helpers')


function ParamParser(clientpath, routepath) {
    try
    {
        if(routepath === "/" || !routepath.match(/{\w+}/)) return null;

        routepath = routepath.split("/")
        clientpath = clientpath.split("/")

        if(routepath.length !== clientpath.length) return null;

        const params = {}

        for(let i = 0; i<routepath.length; i++)
        {
            if(routepath[i][0] === "{" && routepath[i][routepath[i].length - 1] === "}") {
                params[substr(routepath[i])] = pFloat(clientpath[i])
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

        query = query.split(/&|=/);

        for(let i = 0; i<query.length; i+=2)
        {
            queries[query[i]] = pFloat(query[i + 1])
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