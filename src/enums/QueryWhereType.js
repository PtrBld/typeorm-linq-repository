"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var QueryWhereType;
(function (QueryWhereType) {
    /**
     * A normal comparison (not on a joined entity).
     */
    QueryWhereType[QueryWhereType["Normal"] = 0] = "Normal";
    /**
     * A comparison involving a joined entity.
     */
    QueryWhereType[QueryWhereType["Joined"] = 1] = "Joined";
})(QueryWhereType = exports.QueryWhereType || (exports.QueryWhereType = {}));
