const ascii_encoding_references = require('./reference/asciiencodning');

function DecodeToUTF8(query) {
    try
    {
        let found = {}

        for(let i = 0; i<query.length; i++)
        {
            if(query[i] === "%") {
    
                let c9 = query.substring(i, i + 9);
                decoded_c9 = ascii_encoding_references[c9]
    
                if(decoded_c9 !== undefined) {
                    found[c9] = decoded_c9
                    i += 8
                    continue;
                }
    
                let c6 = query.substring(i, i + 6);
                decoded_c6 = ascii_encoding_references[c6]
    
                if(decoded_c6 !== undefined) {
                    found[c6] = decoded_c6
                    i += 5
                    continue;
                }
    
                let c3 = query.substring(i, i + 3);
                decoded_c3 = ascii_encoding_references[c3]
         
                if(decoded_c3 !== undefined) {
                    found[c3] = decoded_c3        
                    i += 2
                    continue;
                }
            }
            else if(query[i] === '+') {
                found['+'] = ' ';
            }
        }
    
        for(const [key, value] of Object.entries(found)) {
            let query_arr = query.split(key)

            query = ""
            for(let i = 0; i<query_arr.length; i++) {
                query += i !== query_arr.length - 1 ? (query_arr[i] + value) : query_arr[i]; 
            }    
        }
    
        return query;
    }
    catch(err)
    {
        console.log(err)
    }
}


module.exports = { DecodeToUTF8 };