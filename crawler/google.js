const sqlite3 = require('sqlite3').verbose();
const google = require('google-translate-api');
const colors = require('colors');
const path = require('path');  

class Crawler {
    constructor() {
        const dbPath = path.join(__dirname, '../words.sqlite');

        this.db = new sqlite3.Database(dbPath, (err) => {
           if (err) {
               this.error(err.message)
           }
       
           console.log(colors.green('Connected to words database...'));
           
           this.fetchWords()
        });
    }

   fetchWords() {
       const limit = process.argv[2] || 10
       this.db.all(`SELECT * FROM words WHERE translation IS NULL ORDER BY RANDOM() LIMIT ${limit}`, [], (err, rows) => {
           if (err) {
               this.error(err.message)
           }

           this.translateWords(rows)
       });
   }

    translateWords(rows) {
        let promises = []
        rows.forEach((row) => {
            promises.push(this.translate(row))
        })

        const vm = this
        Promise.all(promises).then(function(values) {
            console.log(colors.green('Translated::', values.filter(item => item === 1).length))
            console.log(colors.yellow('Not found::', values.filter(item => item === 0).length))
            vm.close()
        })
        .catch(err => {
            vm.close(err)
        });
    }

    translate(row) {
        const  vm = this
        return new Promise(function(resolve, reject) {
            google(row.word, {from: 'en', to: 'ka'}).then(res => {
                // console.log("TEXT::", res.text, row.word);
                // console.log("AUTO::", res.from.text.autoCorrected);
                // console.log("VAL::", res.from.text.value);
                // console.log("MEAN::", res.from.text.didYouMean);
    
                if(!res.from.text.autoCorrected && !res.from.text.didYouMean && res.text && res.text.trim().toLowerCase() !== row.word.trim().toLowerCase()) {
                    vm.update(row, res.text)
                    resolve(1)
                } else {
                    resolve(0)
                }
    
            }).catch(err => {
                // console.error(err);
                reject(err)
            });
        })
    }
   
    update(word, translation) {
        var stmt = this.db.prepare("UPDATE words SET translation = ? WHERE id = ?");
        stmt.run(translation, word.id);
        stmt.finalize();
        return 1
    }

   close(error) {
       this.db.close((err) => {
           if (err) {
               this.error(err.message)
           }
           console.log(colors.green('Close the database connection.'));
           
           this.exit(error)
       });
   }

   error(err) {
       process.exit(console.log(colors.red(err)))
     }
   
    exit(err) {
        if (err) {
            return this.error(err.message)
        }

       process.exit(console.log(colors.green("Done..")))
    }
}

return new Crawler()