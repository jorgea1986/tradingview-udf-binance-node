const Api = require("./api");

class UDFError extends Error {}
class SymbolNotFound extends UDFError {}
class InvalidResolution extends UDFError {}

class UDF {
  constructor() {
    this.api = new Api();
    this.supportedResolutions = ["1"];

    setInterval(() => {
      this.loadSymbols();
    }, 30000);
    this.loadSymbols();
  }

  loadSymbols() {
    const promise = this.api.exchangeInfo().catch((err) => {
      console.error(err);
      setTimeout(() => {
        this.loadSymbols();
      }, 1000);
    });
    this.symbols = promise.then((info) => {
      return info.symbols.map((symbol) => {
        return {
          symbol: symbol.symbol,
          ticker: symbol.symbol,
          name: symbol.symbol,
          full_name: symbol.symbol,
          description: "C_STATS",
          exchange: "CUSTOM STATS",
          listed_exchange: "CUSTOM STATS",
          type: "expression",
          currency_code: "STATISTICS",
          session: "24x7",
          timezone: "UTC",
          minmovement: 1,
          minmov: 1,
          minmovement2: 0,
          minmov2: 0,
          pricescale: Math.ceil(Math.random() * 10),
          supported_resolutions: this.supportedResolutions,
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          data_status: "streaming",
        };
      });
    });

    this.allSymbols = promise.then((info) => {
      let set = new Set();
      for (const symbol of info.symbols) {
        set.add(symbol.symbol);
      }
      return set;
    });
  }

  async checkSymbol(symbol) {
    const symbols = await this.allSymbols;
    return symbols.has(symbol);
  }

  /**
   * Convert items to response-as-a-table format.
   * @param {array} items - Items to convert.
   * @returns {object} Response-as-a-table formatted items.
   */
  asTable(items) {
    let result = {};
    // for every item of the item list
    for (const item of items) {
      // iterate through object properties of each item
      for (const key in item) {
        // if key(property here) is not set in the result set the property/key to an empty []
        if (!result[key]) {
          result[key] = [];
        }
        // else set key property to result, and push everything to the array property of this item
        result[key].push(item[key]);
      }
    }

    for (const key in result) {
      const values = [...new Set(result[key])];
      if (values.length === 1) {
        result[key] = values[0];
      }
    }
    return result;
  }

  /**
   * Data feed configuration data.
   */
  async config() {
    return {
      exchanges: [
        {
          value: "Custom api",
          name: "A custom statistics data",
          desc: "Custom statistics data source",
        },
      ],
      symbols_types: [
        {
          value: "crypto",
          name: "Cryptocurrency",
        },
      ],
      supported_resolutions: this.supportedResolutions,
      supports_search: false,
      supports_group_request: false,
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
    };
  }

  /**
   * Symbols.
   * @returns {object} Response-as-a-table formatted symbols.
   */
 
  async symbolInfo() {
    const symbols = await this.symbols;
    return this.asTable(symbols);
  }

  /**
   * Symbol resolve.
   * @param {string} symbol Symbol name or ticker.
   * @returns {object} Symbol.
   */
  async symbol(symbol) {
    const symbols = await this.symbols;

    const comps = symbol.split(":"); 
    const s = (comps.length > 1 ? comps[1] : symbol).toUpperCase();

    for (const symbol of symbols) {
      if (symbol.symbol === s) {
        return symbol;
      }
    }

    throw new SymbolNotFound();
  }

  /**
   * Symbol search.
   * @param {string} query Text typed by the user in the Symbol Search edit box.
   * @param {string} type One of the symbol types supported by back-end.
   * @param {string} exchange One of the exchanges supported by back-end.
   * @param {number} limit The maximum number of symbols in a response.
   * @returns {array} Array of symbols.
   */
  async search(query, type, exchange, limit) {
    let symbols = await this.symbols;
    if (type) {
      symbols = symbols.filter((s) => s.type === type);
    }
    if (exchange) {
      symbols = symbols.filter((s) => s.exchange === exchange);
    }

    query = query.toUpperCase();
    symbols = symbols.filter((s) => s.symbol.indexOf(query) >= 0);

    if (limit) {
      symbols = symbols.slice(0, limit);
    }
    return symbols.map((s) => ({
      symbol: s.symbol,
      full_name: s.full_name,
      description: s.description,
      exchange: s.exchange,
      ticker: s.ticker,
      type: s.type,
    }));
  }

  /**
   * Bars.
   * @param {string} symbol - Symbol name or ticker.
   * @param {number} from - Unix timestamp (UTC) of leftmost required bar.
   * @param {number} to - Unix timestamp (UTC) of rightmost required bar.
   * @param {string} resolution
   */
  async history(symbol = "STATONE", from, to, resolution) {
    const hasSymbol = await this.checkSymbol(symbol);
    if (!hasSymbol) {
      throw new SymbolNotFound();
    }

    const RESOLUTIONS_INTERVALS_MAP = { 1: "1m" };

    const interval = RESOLUTIONS_INTERVALS_MAP[resolution];
    if (!interval) {
      throw new InvalidResolution();
    }

    let totalKlines = [];

    while (true) {
      const klines = await this.api.klines(symbol, interval, from, to, 500);
      totalKlines = totalKlines.concat(klines);
      if (klines.length == 500) {
        from = klines[klines.length - 1][0] + 1;
      } else {
        if (totalKlines.length === 0) {
          return { s: "no_data" };
        } else {
          return {
            s: "ok", 
            t: totalKlines.map((b) => Math.floor(b[0])), // timestamp
            c: totalKlines.map((b) => parseFloat(b[7])), // closing price(optional)
            o: totalKlines.map((b) => parseFloat(b[4])), // opening(optional)
            h: totalKlines.map((b) => parseFloat(b[1])), // high price(optional)
            l: totalKlines.map((b) => parseFloat(b[2])), // low price(optional)
            v: totalKlines.map((b) => parseFloat(b[5])), // volume (optional)
          };
        }
      }
    }
  }
}

UDF.Error = UDFError;
UDF.SymbolNotFound = SymbolNotFound;
UDF.InvalidResolution = InvalidResolution;

module.exports = UDF;
