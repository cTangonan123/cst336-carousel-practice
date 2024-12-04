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

app.get('/', async (req, res) => {
  let sql = `SELECT movie_id from watchlist WHERE user_id = 1`;
  let rows = await conn.query(sql)
    .then(([rows]) => {
      console.log(rows);
      /* TODO: incorporate this into the searchResults.ejs to check if a result is in watchlist */
      let ids = new Set(rows.map(row => row.movie_id));
      console.log(ids);
      console.log(ids.has(272)) // should be true
      console.log(ids.has(550)) // should be false

      
    })
    .catch(err => console.error(err));


  res.render('index', { pageTitle: "Home", user_id: 1 });
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
      res.render('searchResults', { results: json.results, pageTitle: "Search Results" , user_id: 1});
    }) // where you do stuff
    .catch(err => console.error(err));

  // res.render('searchResults');
})

// how to pass the user_id to the profile page

app.get('/profile/:user_id', async(req, res) => {
  const user_id = req.params.user_id;
  let sql = `
    with r as (SELECT user.id as user_id, user.user_name, user.is_admin, user.password, reviews.id as reviews_id, reviews.movie_id, reviews.title as reviews_title, reviews.review, reviews.rating FROM user 
    LEFT JOIN reviews ON user_id = reviews.user_id
    WHERE user.id = ?)
    select * from r left join movie on r.movie_id = movie.id;`;
  let rows = await conn.query(sql, [user_id])
    .then(([rows]) => {
      console.log(rows);
      res.render('profile', { pageTitle: "Profile", user_id: user_id, results: rows });
    })
    .catch(err => console.error(err));
  
  // res.render('profile', { pageTitle: "Profile", user_id: user_id });
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

app.post('/submitReview', async (req, res) => {
  console.log(req.body);
  // getting the values from the form
  const { movie_id, user_id, title, rating, review } = req.body;
  
  // inserting the values into the database
  // TODO: check first if the user has already submitted a review for this movie
  // if they have, update the review instead of inserting a new one
  // check if movie is already in database
  // if not, add it
  let sqlMovie = `SELECT * FROM movie WHERE id = ?`;
  const [rows] = await conn.query(sqlMovie, [movie_id]);
  

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
    let sql = `INSERT INTO movie (
      id, title, release_date, overview, backdrop_path, poster_path, vote_average
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?
    )`;
    await conn.query(sql, [result.id, result.title, result.release_date, result.overview, result.backdrop_path, result.poster_path, result.vote_average]);
  }




  let sql = `INSERT INTO reviews (movie_id, user_id, title, rating, review) VALUES (?, ?, ?, ?, ?)`;
  await conn.query(sql, [movie_id, user_id, title, rating, review])
    .then(() => console.log('Review submitted!'))
    .catch(err => console.error(err));
    
  // inserting movie to the watchlist when review is submitted.
  let sqlWatchList = `INSERT INTO watchlist (movie_id, user_id) VALUES (?, ?)`;
  await conn.query(sqlWatchList, [movie_id, user_id])
    .then(() => console.log('Movie added to watchlist!'))
    .catch(err => console.error(err));
  
  res.json({ message: 'Review submitted!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});