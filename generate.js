const sqlite3 = require('sqlite3').verbose();
const colors = require('colors');
const fs = require('fs');
const path = require('path');  

class Generate {
 	constructor() {
		this.db = new sqlite3.Database('words.sqlite', (err) => {
			if (err) {
				this.error(err.message)
			}
		
			console.log(colors.green('Connected to words database...'));
			
			this.fetchWords()
		});
  	}

	fetchWords() {
		this.db.all(`SELECT * FROM words ORDER BY word`, [], (err, rows) => {
			if (err) {
				this.error(err.message)
			}

			let htmlData = ''

			rows.forEach((row) => {
				htmlData += this.wordHtml(row)
			});

			this.writeToFile(htmlData)
		});
	}

	wordHtml(row) {
		return `
			<p>
				<idx:entry>
					<idx:orth>${row.word}</idx:orth> &mdash; ${row.translation}
				</idx:entry>
			</p>
		`
	}

	writeToFile(htmlData) {
		const filePath = path.join(__dirname, '/samples/dict.html');
		const vm = this
		fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
			if (err) {
				this.error(err)
			}

			const htmlFileData = data.replace("[WORDS]", htmlData);

			fs.writeFile("./dict.html", htmlFileData, function(err) {
				if(err) {
					vm.error(err)
				}
			
				console.log(colors.green("The file was saved..."));
				
				vm.close()
			}); 

		});
	}
	
	close() {
		this.db.close((err) => {
			if (err) {
				this.error(err.message)
			}
			console.log(colors.green('Close the database connection.'));
			
			this.exit()
		});
	}

	error(err) {
    	process.exit(console.log(colors.red(err)))
  	}
	
	exit() {
    	process.exit(console.log(colors.green("Done..")))
  	}
}

return new Generate()