"use strict";
exports.__esModule = true;
var WrappedSignal_1 = require("./WrappedSignal");
var WrappedOp_1 = require("./WrappedOp");
var a = new WrappedSignal_1.WrappedSignal(1);
var b = new WrappedSignal_1.WrappedSignal(2);
var plusOne = new WrappedOp_1.WrappedOp(function (_a) {
    var x = _a[0], y = _a[1];
    return x + 1;
});
plusOne.setInput(a, b);
plusOne.getOutput().subscribe({
    next: function (v) {
        console.log(v);
    }
});
a.next(20);
a.next(30);
