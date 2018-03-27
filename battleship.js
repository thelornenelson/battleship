$(document).ready(function(){

  // arrays of ships for player and enemy, for position and hit tracking
  const myShips = [{ type: "carrier", length: 5, position: null, row: null, column: null, angle: 0},
    { type: "battleship", length: 4, position: null, row: null, column: null, angle: 0 },
    { type: "cruiser", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "submarine", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "destroyer", length: 2, position: null, row: null, column: null, angle: 0 } ];

  const enemyShips = [{ type: "carrier", length: 5, position: "A1", row: 0, column: 0, angle: 0},
    { type: "battleship", length: 4, position: "A2", row: 1, column: 0, angle: 0 },
    { type: "cruiser", length: 3, position: "A3", row: 2, column: 0, angle: 0 },
    { type: "submarine", length: 3, position: "A4", row: 3, column: 0, angle: 0 },
    { type: "destroyer", length: 2, position: "A5", row: 4, column: 0, angle: 0 } ];

  // set size of board (boardSize x boardSize squares)
  // accessed directly by many functions.
  let boardSize = 10;

  // generate player board and enemy board/shot tracker and insert into DOM
  createBoard($("#player-board").find(".board"), "player-");
  createBoard($("#enemy-board").find(".board"), "enemy-");

  // initiate player ship placement (allow click and move on ships)
  setShips($(".ship"), $("#player-board"));

  // when player clicks begin, start game if ships are ready, otherwise give further instruction.
  $("#begin").on("click", function(){
    if(areShipsReady(myShips)){
      areShipsReady(enemyShips);
      logToTicker("Game On!");

      attack();
    } else {
      logToTicker("Hold on, your ships aren't in position");
    }
  });

  // testing attack stuff =====
  // areShipsReady(enemyShips);
  // // console.dir(enemyShips);
  // attack();
  // testing randomSquare();

  // ===========
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

  // function to handle player's attack turn.
  function attack(){

    logToTicker("Pick a target square.");

    $("#enemy-board").on("click", ".board-square", function(){
      markAttack($(this), enemyShips);
      console.dir(`Mouse clicked cell ${colTag($(this).data().column)}${$(this).data().row + 1} on enemy board`);
      $("#enemy-board").off("click", null);
      enemyAttack()
    });
  }

  // when called, AI will determine where to attack, determine result of attack, and plot results of attack on your board.
  function enemyAttack(){
    let target = randomSquare();
    logToTicker(`Enemy attacks ${getSquareId(target.row, target.column)}`);
    markAttack($(`#player-${getSquareId(target.row, target.column)}`), myShips);
    attack();
  }

  //marks attack on targetSquare, which should be a jquery element object
  //targetShips is the array of ships, hits are logged to it.
  function markAttack(targetSquare, targetShips){
    if(targetSquare.children(".attacks").length === 0){
      let hasShip = "";
      //check if the target square has a ship node in it and if so, add offset to get mark displayed correctly.
      if(targetSquare.children(".player").length){
        hasShip = "attack-ship-offset";
      }
      let data = targetSquare.data();
      //check to see if there's already an attack marked on the square
      // If not, add new hit or miss
      if(isHit(getSquareId(data.row, data.column), targetShips)){
        console.log("It's a hit!");
        $("<div>").text("X").addClass(`attacks hit ${hasShip}`).appendTo(targetSquare);
      } else {
        console.log("Miss!");
        $("<div>").text("O").addClass(`attacks miss ${hasShip}`).appendTo(targetSquare);
      }
    }
  }

  // check if square (in A1 format) is a hit on any of ships in ships array.
  function isHit(position, ships){
    let result = false;
    console.log("checking for hit on position " + position);
    console.dir(ships);
    ships.forEach(function(ship){
      for(square in ship.squares){
        if(position == square){
            console.log(`${ship.type} hit in square ${square}, position ${position}`);
            ship.squares[square] = true;
            result = true;
        }
      }
    });

    return result;

  }

  function setShips(ship, board){
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
        myShips[currentShip.data().shipId].position = id;
        myShips[currentShip.data().shipId].row = data.row;
        myShips[currentShip.data().shipId].column = data.column;
        if(currentShip.hasClass("rotate90")){
          myShips[currentShip.data().shipId].angle = 90;
        }
        if(isShipPosValid(myShips[currentShip.data().shipId])){
          console.log(`placed ${myShips[currentShip.data().shipId].type} in square ${colTag(data.column)}${data.row + 1}`);
          fix(currentShip, $(this));
          currentShip = null;
          ship.on("click", shipClickHandler);
        }
      }
    })
  }

  // logs message to the on-screen "console", for giving instructions or updating on
  // game progress.
  function logToTicker(message){
    $("<div>").text(message).prependTo($(".console"));
  }

  // checks whether all ships are in valid position.
  function areShipsReady(ships){
    let flag = true;

    ships.forEach(function(ship){
      if(isShipPosValid(ship) == false){
        flag = false;
      }
    });

    return flag ? true : false;

  }

  // checks to make sure ship will fit on board based on row/column/length.
  // If yes, return true. If not, sets position, row, and column to null and returns undefined.
  function isShipPosValid(ship){
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

    // adds squares occupied by ship to ship.squares object with
    // square positions (A1, K5, etc) as keys with value false (ie not hit);
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

  // return offset corrections to shift ship to cursor when rotated
  function calcRotationPositionCorr(elm){
    return {xCorr: elm.width() / -2, yCorr: elm.width() / 2 };
  }

  // ties jQuery object elm to move with the mouse cursor
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

  // fixes element at current position by appending to parent and unbinds mousemove event
  function fix(elm, parent){
    $(document).off("mousemove", null);
    $(document).off("keydown", null);

    elm.appendTo(parent);
    elm.removeAttr("style");

    if(elm.hasClass("rotate90")){
      let corr = calcRotationPositionCorr(elm);
      // if ship is rotated, we need to calculate and set a custom relative position depending on element length.
      elm.css({
        position: "relative",
        left:  corr.xCorr + 24,
        top:   corr.yCorr - 16
      });
    } else {
      // adds class describing default relative positioning required to align ships on the board
      elm.addClass("ship-position");
    }
  }

  // created div elements for size x size board and replaces elm with newly generated board
  function createBoard(elm, idPrefix){
    let board = $("<div>").addClass("board").css({"grid-template-columns": `repeat(${boardSize}, 2.5em)`});
    for(let i = 0; i < boardSize; i++){
      for(let j = 0; j < boardSize; j++){
        $("<div>").attr("id", `${idPrefix}${colTag(j)}${i + 1}`).text(`${colTag(j)}${i + 1}`).data({column: j, row: i}).addClass("board-square").appendTo(board);
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

  // returns square ID in A1, B5, C10, etc format.
  function getSquareId(row, column){
    return `${colTag(column)}${row + 1}`
  }

  // returns an object of format {row: [0-boardSize], column: [0-boardSize]}
  // where row and column values are picked randomly.
  function randomSquare(){
    const square = { row: null, column: null };

    for(axis in square){
      square[axis] = Math.floor(Math.random() * boardSize);
    }

    return square;
  }

});
