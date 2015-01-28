module.exports = {

    findLocaleColumn: function (locale, rows) {
        var firstRow = rows["1"],
            r;
        for (r in firstRow) {
            if (firstRow.hasOwnProperty(r)) {
                if (firstRow[r] == locale) {
                    return r;
                }
            }
        }
        return null;
    },

    findRowForKey: function (key, rows) {
        for (var r in rows) {
            if (rows.hasOwnProperty(r)) {
                var row = rows[r],
                    firstValue = row["1"];
                if (firstValue == key) {
                    return r;
                }
            }
        }
        return null;
    },

    receiveSpreadsheet: function (spreadsheet, cb) {
        if (spreadsheet.received) {
            cb(spreadsheet.received.err, spreadsheet.received.rows, spreadsheet.received.info);
        } else {
            spreadsheet.receive(function (err, rows, info) {
                spreadsheet.received = {
                    rows: rows,
                    err: err,
                    info: info
                };
                cb(err, rows, info);
            });
        }
    },


    fetchTranslations: function (spreadsheet, locale, cb) {
        var self = this;

        this.receiveSpreadsheet(spreadsheet, function (err, rows, info) {
            if (err) {
                throw err;
            }

            var column = self.findLocaleColumn(locale, rows);

            var data = {};
            if (column) {

                for (var r in rows) {
                    if (r != "1" && rows.hasOwnProperty(r)) {
                        if (rows[r][column] != null) {
                            var v = rows[r][column];
                            v = v == "EMPTY" ? "" : v;
                            data[rows[r]["1"]] = v;

                        }
                    }
                }
            } else {
                err = null;
            }

            cb(err, data);
        });
    }

};