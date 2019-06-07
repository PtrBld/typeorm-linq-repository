"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilderPart {
    constructor(queryAction, queryParams) {
        this._queryAction = queryAction;
        this._queryParams = queryParams;
    }
    get queryAction() {
        return this._queryAction;
    }
    get queryParams() {
        return this._queryParams;
    }
}
exports.QueryBuilderPart = QueryBuilderPart;
