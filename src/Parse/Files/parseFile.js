const { Mimes, BodyParserMimes } = require('../../MIME/mime')
const { substr, pFloat } = require('../helpers')

function MultiPartFormData(w, r) {
    try
    {
        if(!r.Headers['Content-Type']?.match(/multipart\/form-data/g)) return

        const boundary = '--' + r.Headers['Content-Type'].split('boundary=')[1]

        const boundary_regex = new RegExp(boundary + '--|' + boundary)
        
        let formdata = r.Raw.toString('utf-8').split(boundary_regex)


        for(let i = 1; i<formdata.length; i++)
        {
            const segments = formdata[i].split(/\r\n/);

            if(segments.length < 3) continue;

            const disposition = segments[1].split('; ')

            const name = substr(disposition[1].match(/(\".+?\")$/g)[0]);
            const filename = substr(disposition[2]?.match(/(\".+?\")$/g)[0]);

            if(!filename) {
                r.Body[name] = pFloat(segments[3])

                continue;
            }

            const encoding = segments[2].split(': ')[1].split('/')[0] === 'image' ? 'latin1' : 'utf-8'

            let filedata_seg = encoding === 'latin1' ? r.Raw.toString('latin1').split(boundary_regex)[i].split(/\r\n/) : segments;
            
            let fileContent = ''
            for(let j = 4; j<filedata_seg.length; j++)
            {
               fileContent += j === filedata_seg.length - 1 ? filedata_seg[j] : filedata_seg[j] + '\r\n'
            }

            const fileBuffer = Buffer.from(fileContent, encoding);
            const fileOptions = r.Options.FileUpload 

            let data = null

            if(fileOptions.output === 'buffer') data = fileBuffer
            else if(fileOptions.output === 'string') data = fileContent

            if(fileOptions.limit !== -1 && fileBuffer.length > fileOptions.limit) data = null            

            r.Files[name] = {
                data: data,
                name: data ? filename : 'File exceeded size limit',
                size: data ? fileBuffer.length : 0
            }
        }
    }
    catch(err)
    {
        console.log(err)
        w.SendStatus(500)
    }
}


function Files(w, r) {
    try
    {
        if(!r.Headers['Content-Type'] || BodyParserMimes[r.Headers['Content-Type']]) return

        const IsImage = r.Headers['Content-Type'].match(/image/)

        const fileContent = IsImage ? r.Raw.toString('latin1') : r.Raw.toString('utf-8')

        const fileBuffer = IsImage ? Buffer.from(fileContent, 'latin1') : Buffer.from(fileContent, 'utf-8') 
        const fileOptions = r.Options.FileUpload 

        let data = null

        if(fileOptions.output === 'buffer') data = fileBuffer
        else if(fileOptions.output === 'string') data = fileContent

        if(fileOptions.limit !== -1 && fileBuffer.length > fileOptions.limit) data = null            

        r.Files['file'] = {
            data: data,
            type: Mimes[r.Headers['Content-Type']] ?? 'Unknown',
            size: data ? fileBuffer.length : 0
        }
    }
    catch(err)
    {
        console.log(err);
        w.SendStatus(500)
    }
}


module.exports = { MultiPartFormData, Files}