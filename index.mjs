import express from 'express';
import 'dotenv/config';


const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.json());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/searchResults', async (req, res) => {
  // console.log(req.query.search);
  const search_query = req.query.search;
  const url = `https://api.themoviedb.org/3/search/movie?query=${search_query}&page=1`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`
    }
  };

  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      console.log(json);
      res.render('searchResults', { results: json.results });
    }) // where you do stuff
    .catch(err => console.error(err));

  // res.render('searchResults');
})

app.post('/watchlist', (req, res) => {
  console.log(req.body.movie_id);
  // check if movie is already in database
  // if not, add it
  const url = `https://api.themoviedb.org/3/movie/${movie_id}?language=en-US`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`
    }
  };

  fetch(url, options)
    .then(res => res.json())
    .then(json => console.log(json)) // where to do stuff
    .catch(err => console.error(err));

  res.json({ message: 'Movie added to watchlist' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});