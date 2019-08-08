"use strict";
exports.__esModule = true;
var Node_1 = require("./Node");
var SVG = require("svg.js");
var SceneLayout_1 = require("./SceneLayout");
var SceneDisplay = /** @class */ (function () {
    function SceneDisplay(id, scene) {
        var _this = this;
        this.id = id;
        this.scene = scene;
        this.nodeDisplays = new Map();
        this.edgeDisplays = new Map();
        this.svg = SVG(id);
        this.scene.getNodesStream().subscribe(function (nodes) {
            var desiredIDs = nodes.map(function (n) { return n.getID(); });
            var existingIDs = Array.from(_this.nodeDisplays.keys());
            var toAdd = new Set(SceneLayout_1.difference(desiredIDs, existingIDs));
            var toRemove = new Set(SceneLayout_1.difference(existingIDs, desiredIDs));
            toRemove.forEach(function (tr) {
                var display = _this.nodeDisplays.get(tr);
                display.remove();
                _this.nodeDisplays["delete"](tr);
            });
            nodes.forEach(function (n) {
                var nid = n.getID();
                if (toAdd.has(nid)) {
                    var display = new NodeDisplay(_this.svg, n);
                    _this.nodeDisplays.set(nid, display);
                }
            });
        });
        this.scene.getEdgesStream().subscribe(function (edges) {
            var desiredIDs = edges.map(function (e) { return e.getID(); });
            var existingIDs = Array.from(_this.edgeDisplays.keys());
            var toAdd = new Set(SceneLayout_1.difference(desiredIDs, existingIDs));
            var toRemove = new Set(SceneLayout_1.difference(existingIDs, desiredIDs));
            toRemove.forEach(function (tr) {
                var display = _this.edgeDisplays.get(tr);
                display.remove();
                _this.edgeDisplays["delete"](tr);
            });
            edges.forEach(function (e) {
                var eid = e.getID();
                if (toAdd.has(eid)) {
                    var display = new EdgeDisplay(_this.svg, e);
                    _this.edgeDisplays.set(eid, display);
                }
            });
        });
    }
    return SceneDisplay;
}());
exports.SceneDisplay = SceneDisplay;
var NodeDisplay = /** @class */ (function () {
    function NodeDisplay(svg, node) {
        var _this = this;
        this.svg = svg;
        this.node = node;
        this.propDisplays = new Map();
        this.rect = this.svg.rect(0, 0).attr({
            'fill-opacity': 0,
            'stroke': '#000',
            'stroke-width': 1
        });
        this.label = this.svg.text(this.node.getLabel());
        this.layoutSubscription = this.node.getLayoutStream().subscribe(function (layout) {
            _this.rect.attr({
                width: layout.width,
                height: layout.height,
                x: layout.x - layout.width / 2,
                y: layout.y - layout.height / 2
            });
            _this.label.move(layout.x - layout.width / 2 + 5, layout.y - layout.height / 2 + 5);
            var inputs = Object.keys(layout.inputs).map(function (k) { return [k, layout.inputs[k], Node_1.IO.Input]; });
            var outputs = Object.keys(layout.outputs).map(function (k) { return [k, layout.outputs[k], Node_1.IO.Output]; });
            var ios = inputs.concat(outputs);
            var desiredKeys = [];
            ios.forEach(function (_a) {
                var key = _a[0], layout = _a[1], io = _a[2];
                var propID = SceneLayout_1.getPropID(_this.node.getID(), key, io);
                // console.log(propID, key, name, io);
                desiredKeys.push(propID);
                if (!_this.propDisplays.has(propID)) {
                    // console.log('create');
                    _this.propDisplays.set(propID, new PropDisplay(_this.svg, _this.node, key, io));
                }
                var propDisplay = _this.propDisplays.get(propID);
                propDisplay.setLayout(layout);
            });
            var toRemoveKeys = [];
            _this.propDisplays.forEach(function (display, key) {
                if (desiredKeys.indexOf(key) < 0) {
                    display.remove();
                    toRemoveKeys.push(key);
                }
            });
            toRemoveKeys.forEach(function (k) { return _this.propDisplays["delete"](k); });
        });
    }
    NodeDisplay.prototype.remove = function () {
        this.rect.remove();
        this.label.remove();
        this.propDisplays.forEach(function (propDisplay) {
            propDisplay.remove();
        });
        this.layoutSubscription.unsubscribe();
    };
    return NodeDisplay;
}());
exports.NodeDisplay = NodeDisplay;
var PropDisplay = /** @class */ (function () {
    function PropDisplay(svg, node, propName, io) {
        var _this = this;
        this.svg = svg;
        this.node = node;
        this.propName = propName;
        this.io = io;
        this.rect = this.svg.rect(0, 0).attr({
            'fill-opacity': 0,
            'stroke': io === Node_1.IO.Input ? '#000' : '#F00',
            'stroke-width': 1
        });
        this.label = this.svg.text("'" + this.propName + "'");
        if (this.io === Node_1.IO.Output) {
            this.outputSubscription = this.node.pluckOutput(this.propName).subscribe(function (value) {
                _this.label.text("'" + _this.propName + "': " + JSON.stringify(value));
            });
        }
    }
    PropDisplay.prototype.setLayout = function (layout) {
        this.rect.attr({
            width: layout.width,
            height: layout.height,
            x: layout.x - layout.width / 2,
            y: layout.y - layout.height / 2
        });
        this.label.move(layout.x - layout.width / 2 + 5, layout.y - layout.height / 2 + 5);
    };
    PropDisplay.prototype.remove = function () {
        if (this.outputSubscription) {
            this.outputSubscription.unsubscribe();
        }
        this.rect.remove();
        this.label.remove();
    };
    return PropDisplay;
}());
exports.PropDisplay = PropDisplay;
var EdgeDisplay = /** @class */ (function () {
    function EdgeDisplay(svg, edge) {
        var _this = this;
        this.svg = svg;
        this.edge = edge;
        this.line = this.svg.path('').attr({
            'fill-opacity': 0,
            'stroke': '#000',
            'stroke-width': 1
        });
        this.edge.getLayoutStream().subscribe(function (layout) {
            var points = layout.points;
            if (points.length > 1) {
                var pointStrings = points.map(function (pnt) { return pnt.x + " " + pnt.y; });
                var pathString = "M " + pointStrings[0];
                for (var i = 1; i < pointStrings.length - 1; i += 2) {
                    pathString += " Q " + pointStrings[i] + " " + pointStrings[i + 1];
                }
                var sndLstPnt = points[points.length - 2];
                var lastPnt = points[points.length - 1];
                pathString += EdgeDisplay.getArrowPath(sndLstPnt, lastPnt);
                _this.line.plot(pathString);
            }
        });
    }
    EdgeDisplay.prototype.remove = function () {
        this.line.remove();
    };
    EdgeDisplay.getArrowPath = function (sndLstPnt, lastPnt) {
        var theta = Math.atan2(sndLstPnt.y - lastPnt.y, sndLstPnt.x - lastPnt.x);
        var offset = 20 * Math.PI / 180;
        var s = 10;
        var pathString = " m " + Math.cos(theta + offset) * s + " " + Math.sin(theta + offset) * s +
            (" L " + lastPnt.x + " " + lastPnt.y) +
            (" l " + Math.cos(theta - offset) * s + " " + Math.sin(theta - offset) * s);
        return pathString;
    };
    return EdgeDisplay;
}());
exports.EdgeDisplay = EdgeDisplay;
//# sourceMappingURL=Display.js.map