$(document).ready(function(){

  const ships = [{ type: "carrier", length: 5, position: null, row: null, column: null, angle: 0},
    { type: "battleship", length: 4, position: null, row: null, column: null, angle: 0 },
    { type: "cruiser", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "submarine", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "destroyer", length: 2, position: null, row: null, column: null, angle: 0 } ];

  const enemyShips = [{ type: "carrier", length: 5, position: "A1", row: 0, column: 0, angle: 0},
    { type: "battleship", length: 4, position: "A2", row: 1, column: 0, angle: 0 },
    { type: "cruiser", length: 3, position: "A3", row: 2, column: 0, angle: 0 },
    { type: "submarine", length: 3, position: "A4", row: 3, column: 0, angle: 0 },
    { type: "destroyer", length: 2, position: "A5", row: 4, column: 0, angle: 0 } ];

  let boardSize = 10;

  createBoard(boardSize, $("#player-board").find(".board"));
  createBoard(boardSize, $("#enemy-board").find(".board"));

  setShips($(".ship"), $("#player-board"), boardSize);


  // testing attack stuff =====
  areShipsReady(enemyShips, boardSize);
  console.dir(enemyShips);
  attack(enemyShips);
  // ===========

  $("#begin").on("click", function(){
    // console.log(`Are ships ready? ${areShipsReady(ships, boardSize)}`);
    if(areShipsReady(ships, boardSize)){
      areShipsReady(enemyShips, boardSize);
      logToTicker("Game On!");
      attack(enemyShips);
      console.dir(ships);
    } else {
      logToTicker("Hold on, your ships aren't in position");
    }
  });


// ===================== for debugging
  // $("#player-board").on("click", ".board-square", function(){
  //   let data = $(this).data();
  //   console.dir(`Mouse clicked cell ${colTag(data.column)}${data.row + 1} on my board`);
  // });
  //
  // $("#enemy-board").on("click", ".board-square", function(){
  //   let data = $(this).data();
  //   console.dir(`Mouse clicked cell ${colTag(data.column)}${data.row + 1} on enemy board`);
  // });
  // ===================


  function attack(enemyShips){
    $("#enemy-board").on("click", ".board-square", function(){
      let data = $(this).data();
      if(isHit(getSquareId(data.column, data.row), enemyShips)){
        console.log("It's a hit!");
        $("<div>").text("X").addClass("attacks hit").appendTo($(this));
      } else {
        $("<div>").text("O").addClass("attacks miss").appendTo($(this));
      }
      console.dir(`Mouse clicked cell ${colTag(data.column)}${data.row + 1} on enemy board`);
      // $("#enemy-board").off("click", null);
    });
  }

  function isHit(position, enemyShips){
    let result = false;
    enemyShips.forEach(function(ship){
      for(square in ship.squares){
        if(position == square){
            ship.squares[square] = true;
            result = true;
        }
      }
    });
    return result;
  }

  function setShips(ship, board, boardSize){
    let currentShip = null;
    let shipClickHandler = function(){
      console.log(`Handling click on ship ${$(this).data().shipId}`);
      currentShip = $(this);
      $(".ship").off("click", null);
      move(currentShip);
      $(document).on("keydown", function(event){
        if(event.which == 82){
          currentShip.toggleClass("rotate90");
          console.log(`R key was pressed, rotating ship`);
        }
      });
    };

    ship.on("click", shipClickHandler);

    board.on("click", ".board-square", function(){
      if(currentShip){
        let data = $(this).data();
        let id = getSquareId(data.row, data.column);
        ships[currentShip.data().shipId].position = id;
        ships[currentShip.data().shipId].row = data.row;
        ships[currentShip.data().shipId].column = data.column;
        if(currentShip.hasClass("rotate90")){
          ships[currentShip.data().shipId].angle = 90;
        }
        if(isShipPosValid(ships[currentShip.data().shipId], boardSize)){
          console.log(`placed ${ships[currentShip.data().shipId].type} in square ${colTag(data.column)}${data.row + 1}`);
          fix(currentShip, $(`#${id}`));
          currentShip = null;
          ship.on("click", shipClickHandler);
        }
      }
    })
  }

  function logToTicker(message){
    $("<div>").text(message).prependTo($(".console"));
  }

  function areShipsReady(ships, boardSize){
    let flag = true;
    ships.forEach(function(elm){
      // console.log(`checking ship ${elm.type}, position ${elm.position}. Is position valid? ${isShipPosValid(elm, boardSize)}`);
      if(isShipPosValid(elm, boardSize) == false){
        flag = false;
      }
    });

    return flag ? true : false;
  }

  // checks to make sure ship will fit on board based on row/column/length.
  // If yes, return true. If not,
  // sets position, row, and column to null and returns undefined.
  function isShipPosValid(ship, boardSize){
    // console.log(`position: ${ship.position}, row ${ship.row}, column ${ship.column}`);
    if(ship.position === null || ship.row === null || ship.column === null){
      // console.log(`isShipPosValid returning false`);
      return false;
    } else if(ship.angle === 0){
      if((ship.column + ship.length) <= boardSize){
        addShipSquares()
        return true;
      }
    } else if(ship.angle === 90){
      if((ship.row + ship.length) <= boardSize){
        addShipSquares()
        return true;
      }
    } else {
      ship.squares = null;
      ship.position = null;
      ship.row = null;
      ship.column = null;
      return undefined;
    }

    function addShipSquares(){
      ship.squares = {};
      if(ship.angle === 0){
        for(let colOffset = 0; colOffset < ship.length; colOffset++){
          ship.squares[getSquareId(ship.row, ship.column + colOffset,)] = false;
        }
      } else if(ship.angle === 90){
        for(let rowOffset = 0; rowOffset < ship.length; rowOffset++){
          ship.squares[getSquareId(ship.row + rowOffset, ship.column)] = false;
        }
      }
    }
  }

  function calcRotationPositionCorr(elm){
    return {xCorr: elm.width() / -2, yCorr: elm.width() / 2 };
  }

// ties jQuery object elm to the mouse cursor
  function move(elm){
    $(document).on("mousemove", function(w){
      //check if element is rotated, and apply position corrections
      let corr = {xCorr: 0, yCorr: 0};
      if(elm.hasClass("rotate90")){
        corr = calcRotationPositionCorr(elm);
        // console.log(`Apply correction of ${corr.xCorr}`);
      }
      elm.removeClass("ship-position");
      console.log("Moving Ship...");
      elm.css({
         position: "absolute",
         left:  w.pageX + corr.xCorr,
         top:   w.pageY + corr.yCorr
      });
    });
  }

// fixes element at current position and unbinds mousemove event
  function fix(elm, parent){
    $(document).off("mousemove", null);
    $(document).off("keydown", null);

    elm.appendTo(parent);
    elm.removeAttr("style");
    if(elm.hasClass("rotate90")){
      let corr = calcRotationPositionCorr(elm);
      elm.css({
        position: "relative",
        left:  corr.xCorr + 24,
        top:   corr.yCorr - 16
      });
    } else {
      elm.addClass("ship-position");
    }
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

  function getSquareId(row, column){
    return `${colTag(column)}${row + 1}`
  }

});
