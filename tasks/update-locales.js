module.exports = function (grunt) {

    var Spreadsheet = require('edit-google-spreadsheet'),
        flow = require('flow.js').flow,
        fs = require("fs"),
        path = require('path'),
        flat = require("flat"),
        _ = require("lodash"),
        spreadsheetUtil = require('../lib/spreadsheet-util');

    grunt.registerMultiTask('update-locales', 'updates translations from google docs', function (worksheetName) {

        worksheetName = worksheetName || "master";

        var done = this.async(),
            options = this.options();

        flow()
            .seq("spreadsheet", function (cb) {
                Spreadsheet.load({
                    debug: true,
                    spreadsheetId: options.spreadsheetId,
                    worksheetName: worksheetName,
                    oauth: options.oauth
                }, cb);
            })
            .seq("locales", function (cb) {
                var spreadsheet = this.vars.spreadsheet;

                spreadsheetUtil.receiveSpreadsheet(spreadsheet, function (err, rows, info) {
                    var firstRow = rows["1"];
                    var locales = [];
                    for (var c in firstRow) {
                        if (firstRow.hasOwnProperty(c) && c != "1" && firstRow[c]) {
                            locales.push(firstRow[c]);
                        }
                    }

                    cb(err, locales);
                });

            })
            .seq("data", function (cb) {
                var self = this;

                flow()
                    .seqEach(this.vars.locales, function (locale, cb) {
                        spreadsheetUtil.fetchTranslations(self.vars.spreadsheet, locale, function (err, data) {
                            if (!err) {
                                var p = path.join(options.dest, locale + ".json");
                                var original = {};
                                if (fs.existsSync(p)) {
                                    original = flat.flatten(JSON.parse(grunt.file.read(p)));
                                }
                                data = _.extend(original, data);
                                grunt.file.write(p, JSON.stringify(flat.unflatten(data, { object: true }), null, 4));
                                grunt.log.writeln('Written to ' + p);
                                cb();
                            } else {
                                cb();
                            }
                        });
                    })
                    .exec(function (err, results) {
                        cb(err, results.data);
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