"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var QueryMode;
(function (QueryMode) {
    /**
     * The default mode of a query in which results are returned.
     */
    QueryMode[QueryMode["Get"] = 0] = "Get";
    /**
     * The mode of a query in which a relation is joined or included.
     */
    QueryMode[QueryMode["Join"] = 1] = "Join";
    /**
     * The mode of a query in which a comparison is being made.
     */
    QueryMode[QueryMode["Compare"] = 2] = "Compare";
})(QueryMode = exports.QueryMode || (exports.QueryMode = {}));
