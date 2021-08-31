const request = require('request')

/**
 * Binance REST API wrapper.
 * // our api wrapper will fall here:! <Rubber DucK>
 */
module.exports = class Api {
    /**
     * Current exchange trading rules and symbol information.
     * @returns {Promise} Response promise.
     */
    // 1. 
    exchangeInfo() {
        return this.request('/exchange-info')
    }
    
    /**
     * Kline/candlestick bars for a symbol. Klines are uniquely identified by their open time.
     * @param {string} symbol - Trading symbol.
     * @param {string} interval - Klines interval.
     * @param {number} startTime - Start time in miliseconds.
     * @param {number} endTime - End time in miliseconds.
     * @param {number} limit - Klines limit.
     * @returns {Promise} Resopnse promise.
     */
    // 2.
    klines() {
        return this.request('/klines')
    }

    /**
     * Common request.
     * @param {string} path - API path.
     * @param {object} options - request options.
     * @returns {Promise} Response promise.
     */
    request(path, options) {
        return new Promise((resolve, reject) => {
            request('http://51.210.198.194:4000' + path, options, (err, res, body) => {
                if (err) {
                    return reject(err)
                }
                if (!body) {
                    return reject(new Error('No body'))
                }

                try {
                    const res = JSON.parse(body)
                    if (res.error) {
                        const err = new Error(res.error)
                        err.code = res.statusCode
                        return reject(err)
                    }
                    return resolve(res)
                } catch (err) {
                    return reject(err)
                }
            })
        })
    }
}
