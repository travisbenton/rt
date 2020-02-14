const cheerio = require('cheerio')
const fetch = require('node-fetch')
const readline = require('readline')

const ROOT = 'https://www.rottentomatoes.com/'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const fetchMovies = async (movie) => {
	const res = await fetch(`${ROOT}napi/search/?limit=5&query=${movie || process.argv[2]}`)
	const body = await res.text()
	const moviesArr = JSON.parse(body).movies

	if (!moviesArr.length) {
		return rl.question('Nothing found. Try again\n', movie => fetchMovies(movie))
	}

	const movieNames = moviesArr
		.map((movie, i) => `${i + 1}) ${movie.name} (${movie.year})`)
		.concat(`${moviesArr.length + 1}) Try again`)

	rl.question(`${movieNames.join('\n')}\n`, async (index) => {
		const indexAsNum = parseInt(index, 10)

		if (indexAsNum === moviesArr.length + 1) {
			return rl.question('Ok, whatcha got?\n', movie => fetchMovies(movie))
		}

		const url = moviesArr[indexAsNum - 1].url
		const res = await fetch(`${ROOT}${url}`)
		const moviePage = await res.text()
		const $ = cheerio.load(moviePage)
		const $pct = $('.mop-ratings-wrap__percentage')

		if (!$pct.length) {
			console.log('Hold your horses! No score yet')
			rl.close()
		} else {
			const score = +$pct.first().text().trim().replace('%', '')
			rl.question('What score is considered passing?\n', num => {
				console.log(score > num ? 'PASS 🎉' : 'FAIL 😢')
				rl.question('Wanna spoil it? (y/n)\n', repl => {
					if (repl === 'yes' || repl === 'y') console.log(`${score}%`)
					rl.close()
				})
			})
		}
	})
}

fetchMovies()