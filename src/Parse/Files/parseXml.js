const { substr, pFloat } = require('../helpers')

const encodingTypes = {
    'ISO-8859-1': 'latin1',
    'UTF-8': 'utf-8',
    'US-ASCII': 'ascii',
    'UTF-16': 'utf-16'
}

const XmlParser = (w, r) => {
    try
    {
        if(r.Headers['Content-Type'] !== 'application/xml') return 

        let encoding = 'UTF-8'

        const xmlDeclaration = r.Raw.toString().match(/^<\?xml.+?>/gm)

        if(xmlDeclaration)
        {
            const encoding_disposition = xmlDeclaration[0].match(/encoding=(".+?"|'.+?')/)
        
            if(encoding_disposition) 
                encoding = substr(encoding_disposition[0].match(/(".+?")|('.+?')/g)[0])
        }

        if(encodingTypes[encoding] === undefined) return;

        const xml_segments = r.Raw.toString(encodingTypes[encoding]).split(/\r\n/).filter(e => e)

        let singleLine = ``;
        
        for(let i = 0; i<xml_segments.length; i++)
        {
            const row = xml_segments[i].split(/^(\s+)/gm)

            if(row.length === 1 && row[0].match(/<\?xml/) === null) 
                singleLine += row[0];
            else if(row.length > 1) 
                singleLine += row[2]
        }

        const result = traverseXml(r.Body, singleLine)

        if(result === undefined) r.Body = {} 
    }
    catch(err)
    {
        console.log(err)
    }
}


function traverseXml(layers, row, index = 0, s = [])
{
    try
    {
        let mode = null;
        let w_Key = ''
        let w_Value = ''  
        let stack = s;
        
        for(let i = index; i<row.length; i++)
        {
            if(row[i] === '<') { 
    
                const segments = w_Key.split(' ');
                const tag = segments[0]
    
                if(mode !== null)
                {
                    if(tag[0] === '/') {
                        return [i, w_Value];
                    }
    
                    let isArr = Array.isArray(layers[tag])
                    
                    if(typeof layers[tag] === 'object' && !isArr) {
                        layers[tag] = [layers[tag], {}];
                    } else if(isArr) {
                        layers[tag].push({})
                    } else if(!layers[tag]) {
                        layers[tag] = {} 
                    } 
    
                    isArr = Array.isArray(layers[tag]);
    
                    if(w_Value.trim() !== '') {
                        if(row[i + 1] === '/')
                            layers[tag] = pFloat(w_Value);
                        else {
                            if(isArr) 
                                layers[tag][layers[tag].length - 1]['_text'] = pFloat(w_Value);
                            else 
                                layers[tag]['_text'] = pFloat(w_Value)
                        }
                    }  
    
                    if(segments.length > 1) 
                    {
                        getAttributes(isArr ? layers[tag][layers[tag].length - 1] : layers[tag], w_Key)
                    }
    
                    const values = traverseXml(isArr ? layers[tag][layers[tag].length - 1] : layers[tag], row, i, stack)
                    
                    if(!values) return values;
    
                    i = values[0]
    
                    if(values[1].trim() !== '') 
                        layers['_text'] = pFloat(values[1]);
                }
                mode = true;
                w_Value = ''
                w_Key = ''
                continue;
            }
    
            if(row[i] === '>') {
                mode = false;
                if(stack.length === 0 || w_Key[0] !== '/')
                {
                   stack.push(w_Key)
                } else {
                  if(stack[stack.length - 1].split(' ')[0] !== w_Key.split('/')[1]) return false;
    
                  stack.pop();
                }
                continue
            }
    
            if(mode === null) continue;
    
            if(mode) {
                w_Key += row[i]
            } else {
                w_Value += row[i]
            }
        }
    
        return null;
    }
    catch(err)
    {
        console.log(err)
        layers = {}
        return undefined;
    }
}


function getAttributes(layers, data) {

    const keys = data.match(/\s(.+?)=(('.+?')|(".+?"))/gm)

    for(let i = 0; i<keys.length; i++)
    {
        const key = keys[i].split('=')[0]

        const value = keys[i].match(/((".+?")|('.+?'))$/gm)[0];

        layers['_' + key.substring(1, key.length)] = value.substring(1, value.length - 1)
    }
}



module.exports = XmlParser