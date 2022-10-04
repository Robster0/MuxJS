class Encode {
    constructor() {

    }

    ToBits(response) {
        const buffer = Buffer.from(response, 'utf8')
        let bytes = []

        for(let i = 0; i<buffer.length; i++)
        {
            bytes.push(buffer[i])
        }

        return bytes;
    }

    ToBuffer(body, encoding = 'utf8') {
        return Buffer.from(body, encoding)
    }
}

module.exports = new Encode();