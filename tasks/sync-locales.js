module.exports = function (grunt) {

    var Spreadsheet = require('edit-google-spreadsheet'),
        flow = require('flow.js').flow,
        fs = require("fs"),
        path = require('path'),
        flat = require("flat"),
        _ = require('lodash'),
        spreadsheetUtil = require('../lib/spreadsheet-util');


    grunt.registerTask('sync-locales', 'syncs translations to google docs', function () {
        var done = this.async(),
            options = this.options();

        flow()
            .seq("localeFiles", function () {
                var data = {};
                var localeFiles = fs.readdirSync(options.src);
                localeFiles.forEach(function (localeFile) {
                    if (localeFile.indexOf(".json") > -1) {
                        var locale = localeFile.split(".").shift(),
                            filePath = path.join(options.src, localeFile);

                        data[locale] = JSON.parse(fs.readFileSync(filePath, {encoding: "utf8"}));
                    }
                });

                return data;
            })
            .seq("spreadsheet", function (cb) {
                Spreadsheet.load({
                    debug: true,
                    spreadsheetId: options.spreadsheetId,
                    worksheetName: options.worksheetName || "master",
                    oauth: options.oauth
                }, cb);
            })
            .seq("rows", function (cb) {
                var spreadsheet = this.vars.spreadsheet;

                spreadsheetUtil.receiveSpreadsheet(spreadsheet, function (err, rows, info) {
                    cb(err, rows);
                });
            })
            .seq("addData", function (cb) {
                var self = this,
                    localeFiles = this.vars.localeFiles,
                    rows = this.vars.rows,
                    locales = _.keys(this.vars.localeFiles);

                flow()
                    .seqEach(locales, function (locale, cb) {


                        spreadsheetUtil.fetchTranslations(self.vars.spreadsheet, locale, function (err, data) {
                            if (!err) {
                                var localeFile = localeFiles[locale];
                                if (localeFile) {
                                    var flatLocaleFile = flat.flatten(localeFile),
                                        localeFileKeys = _.keys(flatLocaleFile),
                                        dataKeys = _.keys(data),
                                        addData = {};

                                    var diffKeys = _.difference(localeFileKeys, dataKeys);
                                    diffKeys.forEach(function (k) {
                                        var r = spreadsheetUtil.findRowForKey(k, rows),
                                            c = spreadsheetUtil.findLocaleColumn(locale, rows);

                                        if (r == null) {

                                            var nRows = _.size(rows);
                                            var nSize = (nRows == 0 ? "2" : (nRows + 1)) + "";
                                            rows[nSize + ""] = rows[nSize] || {};
                                            rows[nSize + ""]["1"] = k;
                                            r = nSize;
                                        }

                                        if (c == null) {
                                            var cSize = ((_.size(rows["1"])) + 2) + "";
                                            rows["1"] = rows["1"] || {};
                                            rows["1"][cSize] = locale;
                                            addData["1"] = addData["1"] || {};
                                            c = cSize;
                                            addData["1"][c] = [locale];
                                        }

                                        addData[r] = addData[r] || {};
                                        addData[r]["1"] = [k];
                                        addData[r][c] = [flatLocaleFile[k] || ""];
                                    });
                                    try {
                                        self.vars.spreadsheet.add(addData);
                                        self.vars.spreadsheet.send(cb);
                                    } catch (e) {
                                        grunt.log.write(JSON.stringify(addData));
                                        throw e;
                                    }
                                } else {
                                    cb();
                                }
                            } else {
                                cb();
                            }
                        });
                    })
                    .exec(function (err, results) {
                        cb(err);
                    });
            })
            .exec(function (err, results) {
                if (!err) {
                    // clear cache;
                    results.spreadsheet.received = null;
                    grunt.log.writeln('Successfully updated locales');
                } else {
                    grunt.log.error('Updating locales failed : ' + err);
                }
                done(err);
            });

    });


};