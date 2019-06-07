"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const Query_1 = require("../query/Query");
/**
 * Base repository operations for TypeORM entities.
 */
class LinqRepository {
    /**
     * Constructs the repository for the specified entity with, unless otherwise specified, a property named "id" that is auto-generated.
     * @param entityType The entity whose repository to create.
     * @param options Options for setting up the repository.
     */
    constructor(entityType, options) {
        let autoGenerateId = true;
        let connectionName;
        if (options) {
            if (typeof (options.autoGenerateId) === "boolean") {
                autoGenerateId = options.autoGenerateId;
            }
            if (options.connectionName) {
                connectionName = options.connectionName;
            }
        }
        this._repository = typeorm_1.getConnectionManager()
            .get(connectionName)
            .getRepository(entityType);
        this._autoGenerateId = autoGenerateId;
    }
    create(entities) {
        if (this._autoGenerateId) {
            // Set "id" to undefined in order to allow auto-generation.
            if (entities instanceof Array) {
                for (const entity of entities) {
                    entity.id = undefined;
                }
            }
            else {
                entities.id = undefined;
            }
        }
        return this.update(entities);
    }
    createQueryBuilder(alias) {
        return this._repository.createQueryBuilder(alias);
    }
    delete(entities) {
        let deletePromise = null;
        if (typeof (entities) === "number" || typeof (entities) === "string") {
            deletePromise = this._repository.delete(entities);
        }
        else {
            deletePromise = this._repository.remove(entities);
        }
        return deletePromise.then(() => {
            return Promise.resolve(true);
        });
    }
    getAll() {
        const queryBuilder = this.createQueryBuilder("entity");
        const query = new Query_1.Query(queryBuilder, queryBuilder.getMany);
        return query;
    }
    getById(id) {
        const alias = "entity";
        let queryBuilder = this.createQueryBuilder(alias);
        queryBuilder = queryBuilder.where(`${alias}.id = :id`, { id });
        const query = new Query_1.Query(queryBuilder, queryBuilder.getOne);
        return query;
    }
    getOne() {
        const queryBuilder = this.createQueryBuilder("entity");
        const query = new Query_1.Query(queryBuilder, queryBuilder.getOne);
        return query;
    }
    update(entities) {
        return this._repository.save(entities);
    }
}
exports.LinqRepository = LinqRepository;
