"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bold = exports.white = exports.cyan = exports.green = exports.red = void 0;
function colorize(str, color) {
    return `\x1b[${color}m${str}\x1b[0m`;
}
const red = (str) => {
    return colorize(str, 31);
};
exports.red = red;
const green = (str) => {
    return colorize(str, 32);
};
exports.green = green;
const cyan = (str) => {
    return colorize(str, 96);
};
exports.cyan = cyan;
const white = (str) => {
    return colorize(str, 39);
};
exports.white = white;
const bold = (str) => {
    return colorize(str, 1);
};
exports.bold = bold;
//# sourceMappingURL=color.js.map