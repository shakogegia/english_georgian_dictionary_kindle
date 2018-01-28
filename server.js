const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

const sqlite3 = require('sqlite3').verbose();
let db = null

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (request, response) => {
    response.send('Hello from Express!')
})

app.get('/count', (request, response) => {
    let sqlString = ''

    if(request.query.filter == 1) {
        sqlString = ' WHERE translation IS NOT NULL'
    } else if(request.query.filter == 2) {
        sqlString = ' WHERE translation IS NULL'
    }

    db.all(`SELECT count(*) as count FROM words ${sqlString}`, [], (err, rows) => {
        if (err) {
            throw new Error(err)
        }

        db.serialize(() => {
            db.each(`SELECT count(*) - count(translation) untranslated, count(translation) translated, count(*) total FROM words;`, (err, row) => {
                if (err) {
                    throw new Error(err)
                }
                
                result = rows[0]
                result.translated = row.translated
                result.untranslated = row.untranslated
                result.total = row.total
                response.send(result)
            });
        });
        
    });
})

app.post('/store', (request, response) => {
    db.run(`INSERT INTO words (word, translation) VALUES (?, ?)`, [request.body.word, request.body.translation], function(err) {
        if (err) {
          return console.log(err.message);
        }
        let word = request.body
        word.id = this.lastID
        word.isLoading = false
        response.send(word)
    });
})

app.put('/update', (request, response) => {
    var stmt = db.prepare("UPDATE words SET word = ?, translation = ? WHERE id = ?");
    stmt.run(request.body.word, request.body.translation, request.body.id);
    stmt.finalize();
    response.send(request.body)
})

app.get('/delete', (request, response) => {
    db.run(`DELETE FROM words WHERE id = ?`, [request.query.id], function(err) {
        if (err) {
          return console.log(err.message);
        }
        response.send({status: 'OK'})
    });
})

app.get('/fetch', (request, response) => {
    let sqlString = ''

    if(request.query.filter == 1) {
        sqlString = ' WHERE translation IS NOT NULL'
    } else if(request.query.filter == 2) {
        sqlString = ' WHERE translation IS NULL'
    }
    
    db.all(`SELECT *, 0 as isLoading FROM words ${sqlString} ORDER BY ${(request.query.sort || 'word')} ${(request.query.order || 'asc')} LIMIT ${(request.query.offset || 0)}, ${(request.query.limit || 10)} `, [], (err, rows) => {
        if (err) {
            throw new Error(err)
        }

        response.send(rows)
    });
})
  
app.use((err, request, response, next) => {
    // log the error, for now just console.log
    console.log(err)
    response.status(500).send('Something broke!')
})

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    db = new sqlite3.Database('words.sqlite', (err) => {
        if (err) {
            this.error(err.message)
        }
    
        console.log('Connected to words database...');
    });

    console.log(`server is listening on ${port}`)
})
