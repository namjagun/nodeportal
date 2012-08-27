/**
 *
 */
var mongoose = require('mongoose'), DefaultDataHandler = require("./DefaultDataHandler"),
    DBActions = require("./DBActions").DBActions,
    Properties = require("node-properties-parser"),
    AppProperties = require("./AppProperties");

function populateAppProps(app, next) {
    var propsFile = "np.properties";
    Properties.read(process.cwd() + "/lib/" + propsFile, function (err, props) {
        if (err) throw err;

        AppProperties.set("DATABASE_NAME", props["db.name"]);
        AppProperties.set("DB_URL", "mongodb://" + props['db.user'] + ":"
            + props['db.password'] + "@" + props['db.host'] + ":" +
            props['db.port'] + "/" + props['db.name']);
        AppProperties.set("SESSION_MAX_AGE", parseInt(props["session.max.age"]) * 60000);
        AppProperties.set("PASSWORD_ENC_ALGO", props["password.encryption.algorithm"]);
        AppProperties.set("IMAGE_HANDLER", props["image.handler"]);
        AppProperties.set("THUMB_DIMENSION", props["thumb.dimension"]);
        AppProperties.set("DEFAULT_THUMB_NAME", props["default.thumb.name"]);
        AppProperties.set("THUMB_BACKGROUND", props["thumb.background"]);
        AppProperties.set("IMAGE_DETAIL_DIMENSION", props["image.detail.dimension"]);


        //call next at last
        next(app);
    });
}

function bindPort(app) {
    //if port is given in terminal
    app.listen(process.argv[2] || 4000);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


}

function initDB(app) {
    var dbName = AppProperties.get("DATABASE_NAME"),
        dbURL = AppProperties.get("DB_URL");

    Debug._l("Initiating DB service: " + dbName);

    var db = mongoose.createConnection(dbURL);
    db.on('open', function (e) {
        Debug._l("connected to db: " + dbName);
        if (e) {
            throw e;
        }
        DefaultDataHandler.insertDefaultData(db, app.set("permissions"), function () {
            app.set('db', db);

            var dbActions = new DBActions(db, {modelName:"User"});
            dbActions.get("find", {"default":true}, function (err, users) {
                app.set("Guest", users[0]);
            });

            bindPort(app);
        });
    });
}
module.exports = function (app) {
    populateAppProps(app, initDB);
};