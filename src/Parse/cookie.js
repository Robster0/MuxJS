const { undefinedObj } = require('./helpers')

function CookieParser(w, r) {
    try
    {
        const cookies = r.Headers['Cookie']

        if(!cookies) return
    
        let base64 = new RegExp(/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/)
    
        const cookie_segments = cookies.split('; ')
    
        for(let i = 0; i<cookie_segments.length; i++)
        {
            const [name, value] = cookie_segments[i].split(/=(.*)/s)
    
            r.Cookies[name] = JSONCookie(value.match(base64) ? atob(value) : value)
        }
    }
    catch(err)
    {
        w.SendStatus(500)
    }
}


function JSONCookie(value) {    
    try
    {
       return JSON.parse(value)
    }
    catch(err)
    {
        return value
    }
}



module.exports = CookieParser