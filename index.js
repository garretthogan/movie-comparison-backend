const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const queryString = require('query-string');
const cors = require('cors');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 8080;
const apikey = process.env.OMDB_API_KEY || require('./.env.json').OMDB_API_KEY;
const baseUrl = 'http://www.omdbapi.com';

app.use(bodyParser.json());

function getMovie(id) {
  return fetch(`${baseUrl}/?apikey=${apikey}&i=${id}`)
    .then(data => data.json());
}

function getPage(query) {
  return fetch(`${baseUrl}/?apikey=${apikey}&${queryString.stringify(query)}`)
    .then(data => data.json())  
}

function compareMovies(a, b) {
  const promises = [getMovie(a), getMovie(b)];
  return Promise.all(promises)
    .then(movies => {
      const ratings = movies.map(movie => ({
        title: movie.Title,
        score: movie.Metascore
      })).sort((prev, curr) => (prev.score > curr.score) ? -1 : 1);
      return { ratings, winner: ratings[0] };
    });  
}

app.get('/search', (req, res) => {
  getPage(req.query)
    .then(searchResults => res.send(JSON.stringify(searchResults.Search)))
    .catch(console.log);
});

app.get('/movie/:id', (req, res) => {
  getMovie(req.params.id)
    .then((movie) => res.send(JSON.stringify(movie)))
    .catch(console.log);
});

app.options('/compare', cors());
app.post('/compare', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  compareMovies(req.body.a, req.body.b)
    .then(result => res.send(JSON.stringify(result)));
});

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
