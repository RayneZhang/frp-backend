"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var immutability_helper_1 = require("immutability-helper");
exports.PROP_DEFAULT_NAME = '';
var Node = /** @class */ (function () {
    function Node() {
        this.incomingEdges = new rxjs_1.BehaviorSubject([]);
        this.outgoingEdges = new rxjs_1.BehaviorSubject([]);
    }
    Node.prototype.establishInputStream = function () {
        var inputInfoStream = this.getInputInfoStream();
        var inputAndInfo = rxjs_1.combineLatest(inputInfoStream, this.incomingEdges);
        this.inputStream = inputAndInfo.pipe(operators_1.map(function (_a) {
            var inputInfo = _a[0], incomingEdges = _a[1];
            var propStreams = new Map();
            incomingEdges.forEach(function (edge) {
                var prop = edge.getTo().prop;
                var edgeStream = edge.getStream();
                if (propStreams.has(prop)) {
                    var streams = propStreams.get(prop);
                    var newStreams = immutability_helper_1["default"](streams, { $push: [edgeStream] });
                    propStreams.set(prop, newStreams);
                }
                else {
                    propStreams.set(prop, [edgeStream]);
                }
            });
            var args = [];
            inputInfo.forEach(function (ii) {
                var name = ii.name, raw = ii.raw;
                if (propStreams.has(name)) {
                    var props = propStreams.get(name);
                    if (ii.rest) {
                        args.push.apply(args, props);
                    }
                    else if (props.length === 1) {
                        args.push(props[0]);
                    }
                    else if (props.length === 0) {
                        args.push(undefined);
                    }
                    else {
                        args.push(rxjs_1.combineLatest.apply(void 0, props));
                    }
                }
            });
            return args;
        }));
    };
    Node.prototype.getIncomingEdgesStream = function () {
        return this.incomingEdges;
    };
    Node.prototype.getOutgoingEdgesStream = function () {
        return this.outgoingEdges;
    };
    Node.prototype.addIncomingEdge = function (edge) {
        var ie = this.incomingEdges.getValue();
        var newIncomingEdges = immutability_helper_1["default"](ie, { $push: [edge] });
        this.incomingEdges.next(newIncomingEdges);
    };
    Node.prototype.addOutgoingEdge = function (edge) {
        var oe = this.outgoingEdges.getValue();
        var newOutgoingEdges = immutability_helper_1["default"](oe, { $push: [edge] });
        this.outgoingEdges.next(newOutgoingEdges);
    };
    Node.prototype.removeIncomingEdge = function (edge) {
        var ie = this.incomingEdges.getValue();
        var i = ie.indexOf(edge);
        if (i >= 0) {
            var newIncomingEdges = immutability_helper_1["default"](ie, { $splice: [[i, 1]] });
            this.incomingEdges.next(newIncomingEdges);
        }
    };
    Node.prototype.removeOutgoingEdge = function (edge) {
        var oe = this.outgoingEdges.getValue();
        var i = oe.indexOf(edge);
        if (i >= 0) {
            var newOutgoingEdges = immutability_helper_1["default"](oe, { $splice: [[i, 1]] });
            this.outgoingEdges.next(newOutgoingEdges);
        }
    };
    Node.prototype.pluckOutput = function (prop) {
        if (prop === void 0) { prop = exports.PROP_DEFAULT_NAME; }
        var outputStream = this.getOutputStream();
        return outputStream.pipe(operators_1.pluck(prop));
    };
    return Node;
}());
exports.Node = Node;
var ConstantNode = /** @class */ (function (_super) {
    __extends(ConstantNode, _super);
    function ConstantNode(value, outputInfo) {
        var _a;
        if (outputInfo === void 0) { outputInfo = { name: exports.PROP_DEFAULT_NAME }; }
        var _this = _super.call(this) || this;
        _this.stream = rxjs_1.of((_a = {},
            _a[outputInfo.name] = value,
            _a));
        _this.inputInfoStream = new rxjs_1.BehaviorSubject([]);
        _this.outputInfoStream = new rxjs_1.BehaviorSubject([outputInfo]);
        _this.establishInputStream();
        return _this;
    }
    ConstantNode.prototype.getOutputStream = function () { return this.stream; };
    ;
    ConstantNode.prototype.getInputInfoStream = function () {
        return this.inputInfoStream;
    };
    ;
    ConstantNode.prototype.getOutputInfoStream = function () {
        return this.outputInfoStream;
    };
    ;
    return ConstantNode;
}(Node));
exports.ConstantNode = ConstantNode;
var StaticInfoNode = /** @class */ (function (_super) {
    __extends(StaticInfoNode, _super);
    function StaticInfoNode(inputs, output) {
        var _this = _super.call(this) || this;
        _this.inputInfoStream = new rxjs_1.BehaviorSubject(inputs);
        _this.outputInfoStream = new rxjs_1.BehaviorSubject(output);
        _this.establishInputStream();
        return _this;
        // this.out =   this.inputStream.pipe();
    }
    StaticInfoNode.prototype.getOutputStream = function () {
        return this.out;
    };
    StaticInfoNode.prototype.getInputInfoStream = function () {
        return this.inputInfoStream;
    };
    StaticInfoNode.prototype.getOutputInfoStream = function () {
        return this.outputInfoStream;
    };
    return StaticInfoNode;
}(Node));
var OpNode = /** @class */ (function (_super) {
    __extends(OpNode, _super);
    function OpNode(func, inputs, output) {
        var _this = _super.call(this, inputs, [output]) || this;
        _this.func = func;
        _this.establishInputStream();
        //this.inputStream is a stream
        //    of arrays of streams (values)
        //   x: (1---2--3)  \
        //                   >-- (+)
        //   y: (5---6---)  /
        // Stream( [ Stream(1,2,3), Stream(5,6)])
        _this.out = _this.inputStream.pipe(operators_1.map(function (inp) {
            return rxjs_1.combineLatest.apply(void 0, inp); // produce a stream of the latest values for every arg ( stream of arrays ): Stream([3,6])
        })).pipe(operators_1.mergeMap(function (args) {
            return args.pipe(operators_1.map(function (args) {
                var _a;
                return _a = {},
                    _a[output.name] = _this.func.apply(_this, args),
                    _a;
            }));
        }));
        return _this;
    }
    return OpNode;
}(StaticInfoNode));
exports.OpNode = OpNode;
var GenNode = /** @class */ (function (_super) {
    __extends(GenNode, _super);
    function GenNode() {
        var _this = _super.call(this, [{
                name: 'delay'
            }], [{
                name: exports.PROP_DEFAULT_NAME
            }]) || this;
        _this.intervalID = -1;
        _this.out = new rxjs_1.BehaviorSubject(_this.getRandom());
        _this.inputStream.pipe(operators_1.map(function (inp) {
            return rxjs_1.combineLatest.apply(void 0, inp);
        })).pipe(operators_1.mergeMap(function (args) {
            return args.pipe(operators_1.map(function (args) {
                return args[0];
            }));
        })).subscribe({
            next: function (delay) {
                _this.clear();
                _this.set(delay);
            }
        });
        return _this;
    }
    GenNode.prototype.clear = function () {
        if (this.intervalID >= 0) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    };
    GenNode.prototype.set = function (delay) {
        var _this = this;
        this.intervalID = setInterval(function () {
            _this.out.next(_this.getRandom());
        }, delay);
    };
    GenNode.prototype.getRandom = function () {
        var _a;
        return _a = {},
            _a[exports.PROP_DEFAULT_NAME] = Math.random(),
            _a;
    };
    ;
    return GenNode;
}(StaticInfoNode));
exports.GenNode = GenNode;
//# sourceMappingURL=Node.js.map