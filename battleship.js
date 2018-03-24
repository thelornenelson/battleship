$(document).ready(function(){
  let boardSize = 10;
  createBoard(boardSize, $("#player-board").find(".board"));
  createBoard(boardSize, $("#enemy-board").find(".board"));

  $("#player-board").on("click", ".board-square", function(){
    let data = $(this).data();
    console.dir(`Mouse clicked cell ${colTag(data.column)}${data.row + 1} on my board`);
  });

  $("#enemy-board").on("click", ".board-square", function(){
    let data = $(this).data();
    console.dir(`Mouse clicked cell ${colTag(data.column)}${data.row + 1} on enemy board`);
  });

// click on ship, set css position absolute, track mouse, if clicked on cell, set position based on that cell.
//
  setShip($(".carrier"));

  function setShip(ship){
    ship.on("click", function(){
      move(ship);
    });
  }

// ties jQuery object elm to the mouse cursor
  function move(elm){
    $(document).on("mousemove", function(e){
      elm.css({
         position: "absolute",
         left:  e.pageX,
         top:   e.pageY
      });
    });
  }

  // created div elements for size x size board and replaces elm with newly generated board
  function createBoard(size, elm){
    let board = $("<div>").addClass("board").css({"grid-template-columns": `repeat(${size}, 2.5em)`});
    for(let i = 0; i < size; i++){
      for(let j = 0; j < size; j++){
        $("<div>").text(`${colTag(j)}${i + 1}`).data({column: j, row: i}).addClass("board-square").appendTo(board);
      }
    }
    elm.replaceWith(board);
  }

  // returns the display letter associated with column number.
  function colTag(column){
    const tags = "ABCDEFHIJKLMNOPQRSTUVWXYZ";
    if(column > 25){
      return undefined;
    } else {
      return tags.charAt(column);
    }
  }
});
