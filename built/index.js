"use strict";
exports.__esModule = true;
var WrappedSignal_1 = require("./WrappedSignal");
var WrappedOp_1 = require("./WrappedOp");
var a = new WrappedSignal_1.WrappedSignal(1);
var b = new WrappedSignal_1.WrappedSignal(2);
var plusOne = new WrappedOp_1.WrappedOp(function (x) {
    console.log(x);
    return x + 1;
});
plusOne.setInput(a);
// plusOne.getOutput().subscribe({
//     next: (v: number): void => {
//         console.log(v);
//     }
// })
a.next(20);
a.next(30);
