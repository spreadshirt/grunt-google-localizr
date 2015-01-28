# grunt-google-localizr
Grunt task to sync locale files with google docs spreadsheet

Install
-------

```
$ npm install @spreadshirt/grunt-google-localizr
```

Usage
-----

In your Gruntfile

```js

module.exports = function (grunt) {

    grunt.initConfig({

        // Writes the translations from the spreadsheet to the locale json files
        "update-locales": {
            // default options
            options: {
                spreadsheetId: "1nrl8kkJuQTNck0h7phNis6BKRYWzH4XESdykq0weMdU",
                oauth: {
                    email: '420760534091-812df32m65lmjrk6lre3oiuaqf06108ef@developer.gserviceaccount.com',
                    keyFile: './cert/google-doc-key.pem' // the path to your key file
                },
                dest: "locale", // the directory of your json locale files
            }
        },
        
        // Syncs the json files to the google docs spreadsheet
        "sync-locales": {
           options: {
               spreadsheetId: "1nrl8kkJuQTNck0h7phNis6BKRYWzH4XESdykq0weMdU",
               oauth: {
                    email: '420760534091-812df32m65lmjrk6lre3oiuaqf06108ef@developer.gserviceaccount.com',
                    keyFile: './cert/google-doc-key.pem' // the path to your key file
               },
               src: "locale" // the directory of your json locale files
           }
        }
}

grunt.loadNpmTasks('@spreadshirt/grunt-google-localizr');

```

License
-------

MIT