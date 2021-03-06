var Article_Schema = "Article", Article_Version_Schema = "ArticleVersion",
    columns = ["", "id", "localizedTitle.en_US", "createDate", "displayDate"],
    direction = {"asc":1, "desc":-1 };

var getLatestArticleById = exports.getLatestArticleById = function (id, dbAction, next) {
    dbAction.authorizedGet("findById", id, next);
};

var getArticlesById = exports.getArticlesById = function (id, dbAction, next) {
    var query = dbAction.getQuery().where("id", id).desc('version');

    dbAction.authorizedGetByQuery(query, next);
};

/*
exports.getLatestArticle = function (id, dbAction, next) {
    getArticlesById(id, dbAction, next);
};
*/

exports.getArticlesCount = function (dbAction, next) {
    var query = dbAction.getQuery().desc('version');
    dbAction.authorizedCount(query, next);
};

exports.getArticles = function (dbAction, queryParams, next) {
    var sortCol = queryParams["iSortCol_0"], sortDir = queryParams["sSortDir_0"],
        start = queryParams["iDisplayStart"], length = queryParams["iDisplayLength"],
        searchKeyword = queryParams["sSearch"];

    //same query can't be used for count & search

    var searchQuery = dbAction.getQuery()
        .sort(columns[sortCol], direction[sortDir])
        .limit(length).skip(start),

        countQuery = dbAction.getQuery()
            .sort(columns[sortCol], direction[sortDir])
            .limit(length).skip(start);


    if (searchKeyword) {
        var regex = new RegExp("^" + searchKeyword, "i");
        searchQuery.regex('localizedTitle.en_US', regex);
        countQuery.regex('localizedTitle.en_US', regex);
    }

    dbAction.authorizedCount(countQuery, function (err, count) {
        var ret = {
            data:[],
            count:count
        };
        if (!err && count > 0) {
            dbAction.authorizedGetByQuery(searchQuery, function (err, result) {
                ret.data = result;
                next(err, ret);
            });
        }
        else
            next(err, ret);
    });

};

function getQuery(dbAction, id){
    return dbAction.getQuery().where("id", id);
}
exports.hasArticle = function (id, dbAction, next) {
    dbAction.getByQuery(getQuery(dbAction, id), next);
};

exports.removeArticle = function(id, dbAction, next){
    dbAction.authorizedRemoveByQuery(getQuery(dbAction, id), next);
};

exports.removeArticleVersions = function(id, dbActionVersion, next){
    dbActionVersion.authorizedRemoveByQuery(getQuery(dbActionVersion, id), next);
};

exports.moveArticleToArticleVersion = function(id, dbAction, dbActionVersion, next){
    dbAction.authorizedGet("findById", id, function(err, curArticle){
        if(err){
            return next(err);
        }
        
        dbActionVersion.save(curArticle, function(err, result){
            if(err){
                return next(err);
            }
            if(result){
                dbAction.removeByQuery(getQuery(dbAction, id), next);
            }
        })
    });

};