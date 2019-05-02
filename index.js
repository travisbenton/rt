const cheerio = require('cheerio')
const fetch = require('node-fetch')
const readline = require('readline')

const ROOT = 'https://www.rottentomatoes.com/'
console.log
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const fetchMovies = movie => {
	fetch(`${ROOT}napi/search/?limit=5&query=${movie || process.argv[2]}`)
	  .then(res => res.text())
	  .then(body => {
	  	const moviesArr = JSON.parse(body).movies

	  	if (!moviesArr.length) {
	  		return rl.question('Nothing found. Try again\n', movie => fetchMovies(movie))
	  	}

			const movieNames = moviesArr
				.map((movie, i) => `${i}) ${movie.name} (${movie.year})`)
				.concat(`${moviesArr.length}) Try again`)

			rl.question(`${movieNames.join('\n')}\n`, index => {
				if (+index === moviesArr.length) {
					return rl.question('Ok, whatcha got?\n', movie => fetchMovies(movie))
				}
				const url = moviesArr[index].url

				const moviePage = fetch(`${ROOT}${url}`)
					.then(res => res.text())
					.then(body => {
						const $ = cheerio.load(body)
						const score = +$('.mop-ratings-wrap__percentage').first().text().trim().replace('%', '')

						if (Number.isNaN(score)) {
							console.log('Hold your horses! No score yet')
							rl.close()
						} else {
							rl.question('What score is considered passing?\n', num => {
								console.log(score > num ? 'PASS 🎉' : 'FAIL 😢')
								rl.question('Wanna spoil it? (y/n)\n', repl => {
									if (repl === 'yes' || repl === 'y') console.log(`${score}%`)
									rl.close()
								})
							})
						}
					})
			})

	  })
}

fetchMovies()