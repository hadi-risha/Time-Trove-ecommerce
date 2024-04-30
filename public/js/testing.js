const script = document.createElement('script');
script.src = 'js/anotherScript.js';
document.head.appendChild(script);



(function() {
    // Your code goes here
    console.log("This is a self-invoking function!");
  })();