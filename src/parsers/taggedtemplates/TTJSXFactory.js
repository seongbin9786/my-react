import { TTJSXParser } from "./TTJSXParser.js";
import { TTJSXTokenizer } from "./TTJSXTokenizer.js";

export class TTJSXFactory {
    
    /**
     * @param {string[]} rawStrings 
     * @param {any[]} rawValues 
     */
    parseTTJSX(rawStrings, rawValues) {
        const tokenizer = new TTJSXTokenizer();
        const tokens = tokenizer.tokenize(rawStrings, rawValues);
        const parser = new TTJSXParser();
        return parser.parse(tokens);
    }
}
