document.querySelectorAll('#addToWatchList').forEach(item => {
  item.addEventListener('click', e => {
    //handle click
    let movie_id = e.currentTarget.dataset.movieId
    console.log(movie_id)

    fetch('/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movie_id: movie_id })
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
        alert(data.message)
      })
      .catch((error) => {
        console.error('Error:', error);
      });

  });
});

// instantiation of bootstrap review modal
const reviewModal = new bootstrap.Modal(document.querySelector('#reviewModal'));

// specifically for the write review buttons from results
document.querySelectorAll('#writeReview').forEach(item => {
  item.addEventListener('click', e => {
    let movie_id = e.currentTarget.dataset.movieId
    reviewModal.show()
    console.log(movie_id)
    document.querySelector("#rMovieId").value = movie_id
    document.querySelector("#rUserId").value = 1 // hardcoded for now



  }); //handle click
});

// for the save button on the review modal
document.querySelector("#reviewModal").addEventListener('submit', async(e) => {
  e.preventDefault()
  console.log("clicked")
  // get all values
  let movie_id = document.querySelector("#rMovieId").value
  let user_id = document.querySelector("#rUserId").value
  let title = document.querySelector("#rTitle").value
  let rating = document.querySelector("#rRating").value
  let review = document.querySelector("#rReview").value
  if (rating == "" || review == "" || title == "" || rating > 10 || rating < 0) {
    alert("Please fill out all fields")
    return
  }

  // send fetch request
  // TODO: add post request /submitReview to index.mjs
  // TODO: add toasts for success
  await fetch('/submitReview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ movie_id: movie_id, user_id: user_id, title: title, rating: rating, review: review })
  })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert(data.message)
    })
    .catch((error) => {
      console.error('Error:', error);
      alert("Error: " + error)
    });
  console.log(movie_id, user_id, title, rating, review)
  // close


  reviewModal.hide()

});