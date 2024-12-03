import express from 'express';
import 'dotenv/config';
import mysql from 'mysql2/promise';


const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(express.json());

const pool = mysql.createPool({                   // Create a pool to connect to the database
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database : process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true
});

const conn = await pool.getConnection();          // Get a connection from the pool

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
      // console.log(json);
      res.render('searchResults', { results: json.results });
    }) // where you do stuff
    .catch(err => console.error(err));

  // res.render('searchResults');
})

app.post('/watchlist', async (req, res) => {
  console.log(req.body.movie_id);
  const movie_id = req.body.movie_id;
  // check if movie is already in database
  // if not, add it
  let sql = `SELECT * FROM movie WHERE id = ?`;
  const [rows] = await conn.query(sql, [movie_id]);
  

  const url = `https://api.themoviedb.org/3/movie/${movie_id}?language=en-US`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`
    }
  };

  let result = await fetch(url, options)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      return data;
      
    }) // where to do stuff
    .catch(err => console.error(err));

    // where we add the movie to the database if it isn't already in there
    if (rows.length === 0) {
      sql = `INSERT INTO movie (
        id, title, release_date, overview, backdrop_path, poster_path, vote_average
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )`;
      await conn.query(sql, [result.id, result.title, result.release_date, result.overview, result.backdrop_path, result.poster_path, result.vote_average]);
    }

    // add the movie to the watchlist
    let sql2 = `INSERT INTO watchlist (movie_id, user_id) VALUES (?, ?)`;
    await conn.query(sql2, [movie_id, 1]);

  res.json({ message: 'Movie added to your watchlist' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});