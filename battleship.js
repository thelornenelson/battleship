$(document).ready(function(){

  const ships = [{ type: "carrier", length: 5, position: null },
    { type: "battleship", length: 4, position: null },
    { type: "cruiser", length: 3, position: null },
    { type: "submarine", length: 3, position: null },
    { type: "destroyer", length: 2, position: null } ];

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

  setShip($(".ship"), $("#player-board"));

  // setShips(ships, $("#player-board"));
  //
  // function setShips(ships, board){
  //   console.log("In setShips");
  //   let selector = "";
  //   for(ship in ships){
  //     console.log(`selector = ${selector}`);
  //     selector += `.${ship} `;
  //   }
  //   // remove trailing space
  //   selector = selector.slice(-1);
  //   console.log(selector);
  //   setShip($(selector), board);
  // }

  function setShip(ship, board){
    let currentShip = null;
    ship.on("click", function(){
      currentShip = $(this);
      move(currentShip);
    });
    board.on("click", ".board-square", function(){
      let data = $(this).data();
      let id = getSquareId(data.row, data.column);
      console.log(currentShip.data());
      ships[currentShip.data().shipId].position = id;
      console.log(`placed ${ships[currentShip.data().shipId].type} in square ${colTag(data.column)}${data.row + 1}`);
      fix(currentShip, $(`#${id}`));
    })
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

// fixes element at current position and unbinds mousemove event
  function fix(elm, parent){
    $(document).off("mousemove", null);
    let offset = parent.offset();
    elm.appendTo(parent);
    elm.css({
       position: "relative",
       left:  "0em",
       top:   "0em"
    });
  }

  // created div elements for size x size board and replaces elm with newly generated board
  function createBoard(size, elm){
    let board = $("<div>").addClass("board").css({"grid-template-columns": `repeat(${size}, 2.5em)`});
    for(let i = 0; i < size; i++){
      for(let j = 0; j < size; j++){
        $("<div>").attr("id", `${colTag(j)}${i + 1}`).text(`${colTag(j)}${i + 1}`).data({column: j, row: i}).addClass("board-square").appendTo(board);
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

  function getSquareId(i, j){
    return `${colTag(j)}${i + 1}`
  }

});
