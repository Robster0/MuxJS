class Encode {
    constructor() {

    }

    ToBuffer(body, encoding = 'utf8') {
        return Buffer.from(body, encoding)
    }
}

module.exports = new Encode();