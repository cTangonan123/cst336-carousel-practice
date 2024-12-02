document.querySelectorAll('#addToWatchList').forEach(item => {
  item.addEventListener('click', event => {
    //handle click
    let movie_id = event.currentTarget.dataset.movieId
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