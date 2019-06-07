"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_simple_nameof_1 = require("ts-simple-nameof");
const typeorm_1 = require("typeorm");
const SqlConstants_1 = require("../constants/SqlConstants");
const QueryMode_1 = require("../enums/QueryMode");
const QueryWhereType_1 = require("../enums/QueryWhereType");
const QueryBuilderPart_1 = require("./QueryBuilderPart");
class Query {
    /**
     * Constructs a Query wrapper.
     * @param queryBuilder The QueryBuilder to wrap.
     * @param getAction Either queryBuilder.getOne or queryBuilder.getMany.
     */
    constructor(queryBuilder, getAction, includeAliasHistory = []) {
        this._getAction = getAction;
        this._includeAliasHistory = includeAliasHistory;
        this._initialAlias = queryBuilder.alias;
        this._lastAlias = this._initialAlias;
        this._query = queryBuilder;
        this._queryMode = QueryMode_1.QueryMode.Get;
        this._queryParts = [];
        this._queryWhereType = QueryWhereType_1.QueryWhereType.Normal;
        this._selectedProperty = "";
    }
    get getAction() {
        return this._getAction;
    }
    get query() {
        return this._query;
    }
    get queryParts() {
        return this._queryParts;
    }
    get selected() {
        return this._selectedProperty;
    }
    and(propertySelector) {
        return this.andOr(propertySelector, SqlConstants_1.SqlConstants.OPERATOR_AND, this._query.andWhere);
    }
    beginsWith(value, options) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_LIKE, value, {
            beginsWith: true
        }, options);
    }
    catch(rejected) {
        return this.toPromise()
            .catch(rejected);
    }
    contains(value, options) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_LIKE, value, {
            beginsWith: true,
            endsWith: true
        }, options);
    }
    count() {
        const targetQueryBuilder = this._query.clone();
        this.compileQueryParts(this._queryParts, targetQueryBuilder);
        return targetQueryBuilder.getCount();
    }
    endsWith(value, options) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_LIKE, value, {
            endsWith: true
        }, options);
    }
    equal(value, options) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_EQUAL, value, null, options);
    }
    equalJoined(selector, options) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_EQUAL, selector, options);
    }
    // <any> is necessary here because the usage of this method depends on the interface from which it was called.
    from(foreignEntity) {
        return this.joinForeignEntity(foreignEntity);
    }
    greaterThan(value) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_GREATER, value);
    }
    greaterThanJoined(selector) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_GREATER, selector);
    }
    greaterThanOrEqual(value) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_GREATER_EQUAL, value);
    }
    greaterThanOrEqualJoined(selector) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_GREATER_EQUAL, selector);
    }
    in(include, options) {
        // If comparing strings, must escape them as strings in the query.
        this.escapeStringArray(include);
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_IN, `(${include.join(", ")})`, { quoteString: false }, options);
    }
    include(propertySelector) {
        return this.includePropertyUsingAlias(propertySelector, this._initialAlias);
    }
    inSelected(innerQuery) {
        return this.includeOrExcludeFromInnerQuery(innerQuery, SqlConstants_1.SqlConstants.OPERATOR_IN);
    }
    isFalse() {
        this.equal(false);
        return this;
    }
    isNotNull() {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_IS, SqlConstants_1.SqlConstants.OPERATOR_NOT_NULL, { quoteString: false });
    }
    isNull() {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_IS, SqlConstants_1.SqlConstants.OPERATOR_NULL, { quoteString: false });
    }
    isolatedAnd(and) {
        // TODO: These types are not lining up.
        return this.isolatedConditions(and, this._query.andWhere);
    }
    isolatedOr(and) {
        // TODO: These types are not lining up.
        return this.isolatedConditions(and, this._query.orWhere);
    }
    isolatedWhere(where) {
        // TODO: These types are not lining up.
        return this.isolatedConditions(where, this._query.where);
    }
    isTrue() {
        this.equal(true);
        return this;
    }
    join(propertySelector) {
        return this.joinPropertyUsingAlias(propertySelector, this._initialAlias);
    }
    joinAlso(propertySelector) {
        return this.joinPropertyUsingAlias(propertySelector, this._initialAlias, this._query.leftJoin);
    }
    lessThan(value) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_LESS, value);
    }
    lessThanJoined(selector) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_LESS, selector);
    }
    lessThanOrEqual(value) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_LESS_EQUAL, value);
    }
    lessThanOrEqualJoined(selector) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_LESS_EQUAL, selector);
    }
    notEqual(value, options) {
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_NOT_EQUAL, value, null, options);
    }
    notEqualJoined(selector, options) {
        return this.completeJoinedWhere(SqlConstants_1.SqlConstants.OPERATOR_NOT_EQUAL, selector, options);
    }
    notIn(exclude, options) {
        // If comparing strings, must escape them as strings in the query.
        this.escapeStringArray(exclude);
        return this.completeWhere(SqlConstants_1.SqlConstants.OPERATOR_NOT_IN, `(${exclude.join(", ")})`, { quoteString: false }, options);
    }
    notInSelected(innerQuery) {
        return this.includeOrExcludeFromInnerQuery(innerQuery, SqlConstants_1.SqlConstants.OPERATOR_NOT_IN);
    }
    or(propertySelector) {
        return this.andOr(propertySelector, SqlConstants_1.SqlConstants.OPERATOR_OR, this._query.orWhere);
    }
    orderBy(propertySelector, options) {
        const propertyName = ts_simple_nameof_1.nameof(propertySelector);
        const orderProperty = `${this._lastAlias}.${propertyName}`;
        return this.completeOrderBy(this._query.orderBy, [orderProperty, "ASC"], options);
    }
    orderByDescending(propertySelector, options) {
        const propertyName = ts_simple_nameof_1.nameof(propertySelector);
        const orderProperty = `${this._lastAlias}.${propertyName}`;
        return this.completeOrderBy(this._query.orderBy, [orderProperty, "DESC"], options);
    }
    reset() {
        this._lastAlias = this._initialAlias;
        // Exit the "join chain" so that additional comparisons may be made on the base entity.
        this._queryWhereType = QueryWhereType_1.QueryWhereType.Normal;
        return this;
    }
    select(propertySelector) {
        const selectedProperty = ts_simple_nameof_1.nameof(propertySelector);
        let alias = null;
        // If coming out of a comparison, query is back in "base mode" (where and select use base type).
        if (this._queryMode === QueryMode_1.QueryMode.Get) {
            alias = this._initialAlias;
        }
        // If in a join, use the last joined entity to select a property.
        else {
            alias = this._lastAlias;
        }
        this._selectedProperty = `${alias}.${selectedProperty}`;
        return this;
    }
    skip(skip) {
        if (skip > 0) {
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(this._query.skip, [skip]));
        }
        return this;
    }
    take(limit) {
        if (limit > 0) {
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(this._query.take, [limit]));
        }
        return this;
    }
    then(resolved) {
        return this.toPromise()
            .then(resolved);
    }
    thenBy(propertySelector, options) {
        const propertyName = ts_simple_nameof_1.nameof(propertySelector);
        const orderProperty = `${this._lastAlias}.${propertyName}`;
        return this.completeOrderBy(this._query.addOrderBy, [orderProperty, "ASC"], options);
    }
    thenByDescending(propertySelector, options) {
        const propertyName = ts_simple_nameof_1.nameof(propertySelector);
        const orderProperty = `${this._lastAlias}.${propertyName}`;
        return this.completeOrderBy(this._query.addOrderBy, [orderProperty, "DESC"], options);
    }
    thenInclude(propertySelector) {
        return this.includePropertyUsingAlias(propertySelector, this._lastAlias);
    }
    thenJoin(propertySelector) {
        return this.joinPropertyUsingAlias(propertySelector, this._lastAlias);
    }
    thenJoinAlso(propertySelector) {
        return this.joinPropertyUsingAlias(propertySelector, this._lastAlias, this._query.leftJoin);
    }
    toPromise() {
        return this._getAction.call(this.buildQuery(this));
    }
    usingBaseType() {
        this._lastAlias = this._initialAlias;
        return this;
    }
    where(propertySelector) {
        const whereProperties = ts_simple_nameof_1.nameof(propertySelector);
        let whereProperty = null;
        // Keep up with the last alias in order to restore it after joinMultipleProperties.
        let lastAlias = this._lastAlias;
        // In the event of performing a normal where after a join-based where, use the initial alias.
        if (this._queryMode === QueryMode_1.QueryMode.Get) {
            this._queryWhereType = QueryWhereType_1.QueryWhereType.Normal;
            lastAlias = this._initialAlias;
            // If accessing multiple properties, join relationships using an INNER JOIN.
            whereProperty = this.joinMultipleProperties(whereProperties);
            const where = `${lastAlias}.${whereProperty}`;
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(this._query.where, [where]));
        }
        // Otherwise, this where was performed on a join operation.
        else {
            // If accessing multiple properties, join relationships using an INNER JOIN.
            whereProperty = this.joinMultipleProperties(whereProperties);
            this._queryWhereType = QueryWhereType_1.QueryWhereType.Joined;
            this.createJoinCondition(whereProperty);
        }
        // Restore the last alias after joinMultipleProperties.
        this._lastAlias = lastAlias;
        this._queryMode = QueryMode_1.QueryMode.Compare;
        return this;
    }
    addJoinCondition(whereProperty, condition, targetQueryPart = null) {
        // Result of calling .include(x => x.prop).where(...).<compare>(...).<and/or>(...)
        // [QueryBuilder.leftJoinAndSelect, ["alias.includedProperty", "includedProperty", "includedProperty.property = 'something'"]]
        // OR
        // Result of calling .join(x => x.pop).where(...).<compare>(...).<and/or>(...)
        // [QueryBuilder.innerJoin, ["alias.includedProperty", "includedProperty", "includedProperty.property = 'something'"]]
        const part = targetQueryPart || this._queryParts.pop();
        // "includedProperty.property = 'something'"
        let joinCondition = part.queryParams.pop();
        joinCondition += ` ${condition} ${this._lastAlias}.${whereProperty}`;
        part.queryParams.push(joinCondition);
        // If we did not receive the optional taretQueryPart argument, that means we used the last query part, which was popped from this._queryParts.
        if (!targetQueryPart) {
            this._queryParts.push(part);
        }
    }
    andOr(propertySelector, operation, queryAction) {
        const whereProperties = ts_simple_nameof_1.nameof(propertySelector);
        // If accessing multiple properties during an AND, join relationships using an INNER JOIN.
        // If accessing multiple properties during an OR, join relationships using a LEFT JOIN.
        const joinAction = operation === "AND"
            ? this._query.innerJoin
            : this._query.leftJoin;
        // Keep up with the last alias in order to restore it after joinMultipleProperties.
        const lastAlias = this._lastAlias;
        // If accessing multiple properties, join relationships using an INNER JOIN.
        const whereProperty = this.joinMultipleProperties(whereProperties, joinAction);
        // A third parameter on the query parameters indicates additional join conditions.
        // Only add a join condition if performing a conditional join.
        if (this._queryWhereType === QueryWhereType_1.QueryWhereType.Joined &&
            this._queryParts[this._queryParts.length - 1].queryParams.length === 3) {
            this.addJoinCondition(whereProperty, operation);
        }
        else {
            const where = `${this._lastAlias}.${whereProperty}`;
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(queryAction, [where]));
        }
        // Restore the last alias after joinMultipleProperties.
        this._lastAlias = lastAlias;
        this._queryMode = QueryMode_1.QueryMode.Compare;
        return this;
    }
    buildQuery(query) {
        // Unpack and apply the QueryBuilder parts.
        this.compileQueryParts(query.queryParts, query.query);
        return query.query;
    }
    compileQueryParts(queryParts, builder) {
        if (queryParts.length) {
            for (const queryPart of queryParts) {
                queryPart.queryAction.call(builder, ...queryPart.queryParams);
            }
        }
    }
    completeOrderBy(queryAction, queryParams, options) {
        if (options) {
            if (typeof (options.nullsFirst) === "boolean") {
                queryParams.push(options.nullsFirst ? "NULLS FIRST" : "NULLS LAST");
            }
        }
        this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(queryAction, queryParams));
        return this;
    }
    completeJoinedWhere(operator, selector, options) {
        const selectedProperty = ts_simple_nameof_1.nameof(selector);
        const compareValue = `${this._lastAlias}.${selectedProperty}`;
        // compareValue is a string but should be treated as a join property
        // (not a quoted string) in the query, so use "false" for the "quoteString" argument.
        // If the user specifies a matchCase option, then assume the property is, in fact, a string
        // and allow completeWhere to apply case insensitivity if necessary.
        return this.completeWhere(operator, compareValue, {
            joiningString: !!options && typeof (options.matchCase) === "boolean",
            quoteString: false
        }, options);
    }
    completeWhere(operator, value, optionsInternal, options) {
        let beginsWith = false;
        let endsWith = false;
        let joiningString = false;
        let quoteString = true;
        let matchCase = false;
        if (optionsInternal) {
            if (typeof (optionsInternal.beginsWith) === "boolean") {
                beginsWith = optionsInternal.beginsWith;
            }
            if (typeof (optionsInternal.endsWith) === "boolean") {
                endsWith = optionsInternal.endsWith;
            }
            if (typeof (optionsInternal.joiningString) === "boolean") {
                joiningString = optionsInternal.joiningString;
            }
            if (typeof (optionsInternal.quoteString) === "boolean") {
                quoteString = optionsInternal.quoteString;
            }
        }
        if (options) {
            if (typeof (options.matchCase) === "boolean") {
                matchCase = options.matchCase;
            }
        }
        if (beginsWith) {
            value += "%";
        }
        if (endsWith) {
            value = `%${value}`;
        }
        if (typeof (value) === "string" && quoteString) {
            value = value.replace(/'/g, "''");
            value = `'${value}'`;
        }
        // In case of a from or join within a "where", must find the last "where" in the query parts.
        const nonWheres = [];
        let wherePart = null;
        while (this._queryParts.length && !wherePart) {
            const part = this._queryParts.pop();
            if ((
            // Could either be a normal where function:
            this._queryWhereType === QueryWhereType_1.QueryWhereType.Normal && (
            // tslint:disable-next-line: triple-equals
            part.queryAction == this._query.where ||
                // tslint:disable-next-line: triple-equals
                part.queryAction == this._query.andWhere ||
                // tslint:disable-next-line: triple-equals
                part.queryAction == this._query.orWhere)) || (
            // or a join condition:
            this._queryWhereType === QueryWhereType_1.QueryWhereType.Joined && (
            // tslint:disable-next-line: triple-equals
            part.queryAction == this._query.innerJoin
                // tslint:disable-next-line: triple-equals
                || part.queryAction == this._query.leftJoin
                // tslint:disable-next-line: triple-equals
                || part.queryAction == this._query.leftJoinAndSelect) && part.queryParams.length === 3)) {
                wherePart = part;
            }
            else {
                nonWheres.unshift(part);
            }
        }
        if (!wherePart) {
            throw new Error("Invalid use of conditional method.");
        }
        this._queryParts.push(...nonWheres);
        // If processing a join condition.
        if (this._queryWhereType === QueryWhereType_1.QueryWhereType.Joined) {
            // [QueryBuilder.leftJoinAndSelect, ["alias.includedProperty", "includedProperty", "includedProperty.property"]]
            const part = wherePart;
            // "includedProperty.property"
            let joinCondition = part.queryParams.pop();
            if (typeof (value) === "string" && (quoteString || joiningString) && !matchCase) {
                value = value.toLowerCase();
                joinCondition = `LOWER(${joinCondition})`;
            }
            else if (value instanceof Date) {
                value = `'${value.toISOString()}'`;
            }
            // "includedProperty.property = 'something'"
            joinCondition += ` ${operator} ${value}`;
            part.queryParams.push(joinCondition);
            this._queryParts.push(part);
        }
        // If processing a normal comparison.
        else {
            // [QueryBuilder.<where | andWhere | orWhere>, ["alias.property"]]
            const part = wherePart;
            // "alias.property"
            let where = part.queryParams.pop();
            if (typeof (value) === "string" && (quoteString || joiningString) && !matchCase) {
                value = value.toLowerCase();
                where = `LOWER(${where})`;
            }
            else if (value instanceof Date) {
                value = `'${value.toISOString()}'`;
            }
            where += ` ${operator} ${value}`;
            part.queryParams.push(where);
            this._queryParts.push(part);
        }
        this._queryMode = QueryMode_1.QueryMode.Get;
        return this;
    }
    createJoinCondition(joinConditionProperty) {
        // Find the query part on which to add the condition. Usually will be the last, but not always.
        let targetQueryPart = null;
        const otherParts = [];
        while (!targetQueryPart && this._queryParts.length) {
            const part = this._queryParts.pop();
            // See if this query part is the one in which the last alias was joined.
            if (part.queryParams && part.queryParams.length > 1 && part.queryParams[1] === this._lastAlias) {
                targetQueryPart = part;
            }
            else {
                otherParts.unshift(part);
            }
        }
        if (!targetQueryPart) {
            throw new Error("Invalid use of conditional join.");
        }
        this._queryParts.push(...otherParts);
        // There should not already be a join condition on this query builder part.
        // If there is, we want to add a join condition, not overwrite it.
        if (targetQueryPart.queryParams.length === 3) {
            this.addJoinCondition(joinConditionProperty, "AND", targetQueryPart);
        }
        else {
            const joinCondition = `${this._lastAlias}.${joinConditionProperty}`;
            targetQueryPart.queryParams.push(joinCondition);
        }
        this._queryParts.push(targetQueryPart);
    }
    escapeStringArray(array) {
        array.forEach((value, i) => {
            if (typeof (value) === "string") {
                array[i] = `'${value}'`;
            }
        });
    }
    includeOrExcludeFromInnerQuery(innerQuery, operator) {
        innerQuery.queryParts.unshift(new QueryBuilderPart_1.QueryBuilderPart(innerQuery.query.select, [innerQuery.selected]));
        // Use <any> since all that matters is that the base type of any query contains a property named "id".
        const query = this.buildQuery(innerQuery)
            .getQuery();
        this.completeWhere(operator, `(${query})`, { quoteString: false });
        return this;
    }
    includePropertyUsingAlias(propertySelector, queryAlias) {
        return this.joinOrIncludePropertyUsingAlias(propertySelector, queryAlias, this._query.leftJoinAndSelect);
    }
    isolatedConditions(conditions, conditionAction) {
        const query = conditions(new Query(this._query, this._getAction, this._includeAliasHistory));
        // Do not include joins in bracketed condition; perform those in the outer query.
        const conditionParts = query
            .queryParts
            .filter(qp => 
        // tslint:disable-next-line: triple-equals
        qp.queryAction == query.query.where
            // tslint:disable-next-line: triple-equals
            || qp.queryAction == query.query.andWhere
            // tslint:disable-next-line: triple-equals
            || qp.queryAction == query.query.orWhere);
        // Perform joins in the outer query.
        const joinParts = query
            .queryParts
            .filter(qp => conditionParts.indexOf(qp) < 0);
        this._queryParts.push(...joinParts);
        this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(conditionAction, [
            new typeorm_1.Brackets(qb => {
                this.compileQueryParts(conditionParts, qb);
            })
        ]));
        return this;
    }
    joinForeignEntity(foreignEntity) {
        const entityName = ts_simple_nameof_1.nameof(foreignEntity);
        const resultAlias = entityName;
        this._lastAlias = resultAlias;
        // If just passing through a chain of possibly already executed includes for semantics, don't execute the include again.
        // Only execute the include if it has not been previously executed.
        if (!(this._includeAliasHistory.find(a => a === resultAlias))) {
            this._includeAliasHistory.push(resultAlias);
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(this._query.innerJoin, [foreignEntity, resultAlias, "true"]));
        }
        this.setJoinIfNotCompare();
        return this;
    }
    joinMultipleProperties(whereProperties, joinAction = this._query.innerJoin) {
        // Array.map() is used to select a property from a relationship collection.
        // .where(x => x.relationshipOne.map(y => y.relationshipTwo.map(z => z.relationshipThree)))...
        // Becomes, via ts-simple-nameof...
        // "relationshipOne.map(y => y.relationshipTwo.map(z => z.relationshipThree))"
        // Now get...
        // "relationshipOne.map(y=>y.relationshipTwo.map(z=>z.relationshipThree))"
        whereProperties = whereProperties.replace(/ /g, "");
        // "relationshipOne.relationshipTwo.relationshipThree"
        whereProperties = whereProperties
            .replace(/\.map\(([a-zA-Z0-9_]+)=>[a-zA-Z0-9]+/g, "")
            .replace(/\)/g, "");
        const separatedProperties = whereProperties.split(".");
        const whereProperty = separatedProperties.pop();
        for (let property of separatedProperties) {
            // Array.map() is used to select a property from a relationship collection.
            if (property.indexOf("map(") === 0) {
                property = property.substring(4);
            }
            this.joinPropertyUsingAlias(property, this._lastAlias, joinAction);
        }
        return whereProperty;
    }
    joinOrIncludePropertyUsingAlias(propertySelector, queryAlias, queryAction) {
        let propertyName = null;
        if (propertySelector instanceof Function) {
            propertyName = ts_simple_nameof_1.nameof(propertySelector);
        }
        else {
            propertyName = propertySelector;
        }
        const resultAlias = `${queryAlias}_${propertyName}`;
        this.setJoinIfNotCompare();
        this._lastAlias = resultAlias;
        // If just passing through a chain of possibly already executed includes for semantics, don't execute the include again.
        // Only execute the include if it has not been previously executed.
        if (!(this._includeAliasHistory.find(a => a === resultAlias))) {
            this._includeAliasHistory.push(resultAlias);
            const queryProperty = `${queryAlias}.${propertyName}`;
            this._queryParts.push(new QueryBuilderPart_1.QueryBuilderPart(queryAction, [queryProperty, resultAlias]));
        }
        return this;
    }
    joinPropertyUsingAlias(propertySelector, queryAlias, queryAction = this._query.innerJoin) {
        return this.joinOrIncludePropertyUsingAlias(propertySelector, queryAlias, queryAction);
    }
    setJoinIfNotCompare() {
        // We may be joining a relation to make a comparison on that relation.
        // If so, leave QueryMode as Compare.
        // If not, set QueryMode to Join.
        if (this._queryMode !== QueryMode_1.QueryMode.Compare) {
            this._queryMode = QueryMode_1.QueryMode.Join;
        }
    }
}
exports.Query = Query;
