document.addEventListener('DOMContentLoaded', function() {
  const writingBtn = document.getElementById('writing-btn');
  const speakingBtn = document.getElementById('speaking-btn');
  const advocatingBtn = document.getElementById('advocating-btn');
  const blogPostsContainer = document.getElementById('blog-posts-container');
  const talksContainer = document.getElementById('talks-container');
  const advocatingContainer = document.getElementById('advocating-container');

  console.log('DOM fully loaded and parsed');

  writingBtn.addEventListener('click', function(event) {
    event.preventDefault();
    console.log('Writing button clicked');

    // Change button color to indicate it is selected
    writingBtn.classList.add('selected');
    speakingBtn.classList.remove('selected');
    advocatingBtn.classList.remove('selected');
    console.log('Writing button class "selected" added');
    console.log('Speaking button class "selected" removed');
    console.log('Advocating button class "selected" removed');

    // Show the blog posts container and hide the other containers
    blogPostsContainer.classList.add('visible');
    talksContainer.classList.remove('visible');
    advocatingContainer.classList.remove('visible');
    console.log('Blog posts container class "visible" added');
    console.log('Talks container class "visible" removed');
    console.log('Advocating container class "visible" removed');
  });

  speakingBtn.addEventListener('click', function(event) {
    event.preventDefault();
    console.log('Speaking button clicked');

    // Change button color to indicate it is selected
    speakingBtn.classList.add('selected');
    writingBtn.classList.remove('selected');
    advocatingBtn.classList.remove('selected');
    console.log('Speaking button class "selected" added');
    console.log('Writing button class "selected" removed');
    console.log('Advocating button class "selected" removed');

    // Show the talks container and hide the other containers
    talksContainer.classList.add('visible');
    blogPostsContainer.classList.remove('visible');
    advocatingContainer.classList.remove('visible');
    console.log('Talks container class "visible" added');
    console.log('Blog posts container class "visible" removed');
    console.log('Advocating container class "visible" removed');
  });

  advocatingBtn.addEventListener('click', function(event) {
    event.preventDefault();
    console.log('Advocating button clicked');

    // Change button color to indicate it is selected
    advocatingBtn.classList.add('selected');
    writingBtn.classList.remove('selected');
    speakingBtn.classList.remove('selected');
    console.log('Advocating button class "selected" added');
    console.log('Writing button class "selected" removed');
    console.log('Speaking button class "selected" removed');

    // Show the advocating container and hide the other containers
    advocatingContainer.classList.add('visible');
    blogPostsContainer.classList.remove('visible');
    talksContainer.classList.remove('visible');
    console.log('Advocating container class "visible" added');
    console.log('Blog posts container class "visible" removed');
    console.log('Talks container class "visible" removed');
  });
});