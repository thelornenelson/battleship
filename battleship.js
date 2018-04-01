$(document).ready(function(){

  // arrays of ships for player and enemy, for position and hit tracking
  const myShips = [{ type: "Carrier", length: 5, position: null, row: null, column: null, angle: 0},
    { type: "Battleship", length: 4, position: null, row: null, column: null, angle: 0 },
    { type: "Cruiser", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "Submarine", length: 3, position: null, row: null, column: null, angle: 0 },
    { type: "Destroyer", length: 2, position: null, row: null, column: null, angle: 0 } ];

  const enemyShips = [{ type: "Carrier", length: 5, position: null, row: 0, column: 0, angle: 0},
    { type: "Battleship", length: 4, position: null, row: 1, column: 0, angle: 0 },
    { type: "Cruiser", length: 3, position: null, row: 2, column: 0, angle: 0 },
    { type: "Submarine", length: 3, position: null, row: 3, column: 0, angle: 0 },
    { type: "Destroyer", length: 2, position: null, row: 4, column: 0, angle: 0 } ];

  // set size of board (boardSize x boardSize squares)
  // accessed directly by many functions.
  let boardSize = 10;

  // generate player board and enemy board/shot tracker and insert into DOM
  createBoard($("#player-board").find(".board"), "player-");
  createBoard($("#enemy-board").find(".board"), "enemy-");

  // initiate player ship placement (allow click and move on ships)
  setPlayerShips($(".ship"), $("#player-board"));

  randomSetShips(enemyShips, "enemy");

  $("#randomize").on("click", function(){
    randomSetShips(myShips, "player");
  });

  $(".console").on("dblclick", function(){
    toggleEnemyShips(enemyShips);
  });

  // when player clicks begin, start game if ships are ready, otherwise give further instruction.
  $("#begin").on("click", function(){
    if(areShipsReady(myShips)){
      areShipsReady(enemyShips);
      // this removes the pointer and hover effect
      $(`.player.ship.movable`).removeClass("movable");

      $(".commands, .shipyard").remove();
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


  // function to place ships at random on board
  function randomSetShips(ships, player){
    let possibleAngles = [0, 90];
    ships.forEach(function(ship, index){

      // assume invalid
      let shipValid = false;

      // loop until ship is placed in valid position. "Throw them until they stick!"
      while(!shipValid){

        // reset any previous attempt
        ship.position = null;
        ship.row = null;
        ship.column = null;
        ship.squares = null;

        // pick angle by random array index
        ship.angle = possibleAngles[Math.floor(Math.random() * 2)];

        // determine position limits based on ship length/angle
        let maxRow = ship.angle === 90 ? boardSize - ship.length - 1 : boardSize - 1;
        let maxColumn = ship.angle === 0 ? boardSize - ship.length - 1 : boardSize - 1;
        let square = randomSquare(maxRow, maxColumn);
        ship.row = square.row;
        ship.column = square.column;
        ship.position = getSquareId(square.row, square.column);

        // this should always be valid due to the limits on our placement, but also initializes a bunch of ship data
        shipValid = isShipPosValid(ship);

        // now check ship position against all other ships, to make sure there's no interference.
        ships.forEach(function(checkShip, checkIndex){
          if(index !== checkIndex){
            // don't check ship against itself

            for(square in ship.squares){
              //iterate across squares for current ship (ship being placed)

              if(checkShip.squares){
                // check if squares key exists and is non-false

                if(checkShip.squares[square] !== undefined){
                  // if key square exists on checkShip, then we have interference. Try again!
                  shipValid = false;

                }
              }
            }
          }
        });
      }

      if(player === "player"){
        // select ship DOM element
        let $ship = $(`.player.ship.${ship.type.toLowerCase()}`)

        // remove any previous rotation class
        $ship.removeClass("rotate90");

        // rotate element if required
        if(ship.angle === 90){
          $ship.addClass("rotate90");
        }
        // fix element in position
        fix($ship, $(`#player-${ship.position}`));
        // console.log(`placed ${ship.type} at position ${ship.position} angle ${ship.angle}`);
      }
    });
  }

  function toggleEnemyShips(ships){

    // select enemy ships, if any exist in DOM
    let $ships = $(".enemy.ship");
    if($ships.length > 0){
      // if any ships exist, remove them
      $ships.remove();
    } else {
      // otherwise create dom nodes to show ships.
      ships.forEach(function(ship){
        let $ship = makeShip(ship.type, "enemy", ship.angle);
        // console.log(`fixing enemy ${ship.type}`);
        console.log(`placed enemy ${ship.type} at position ${ship.position} angle ${ship.angle}`);
        fix($ship, $(`#enemy-${ship.position}`))
      });
    }
  }

  function makeShip(type, player, angle){
    let ship = $("<div>");
    ship.addClass(`${player} ship ${type.toLowerCase()}`);
    ship.text(type);
    if(angle === 90){
      ship.addClass("rotate90");
    }
    return ship;
  }

  // function to handle player's attack turn.
  function attack(){

    logToTicker("Pick a target square.");

    // $("#enemy-board .board-square").addClass("pointer");

    $("#enemy-board").on("click", ".board-square", function(){
      markAttack($(this), enemyShips);
      // console.dir(`Mouse clicked cell ${colTag($(this).data().column)}${$(this).data().row + 1} on enemy board`);
      $("#enemy-board").off("click", null);
      enemyAttack()
      // $("#enemy-board .board-square").removeClass("pointer");
    });
  }

  // when called, AI will determine where to attack, determine result of attack, and plot results of attack on your board.
  function enemyAttack(){
    let target = randomSquare(6,6);
    logToTicker(`Enemy attacks ${getSquareId(target.row, target.column)}`);
    markAttack($(`#player-${getSquareId(target.row, target.column)}`), myShips);
    attack();
  }

  //marks attack on targetSquare, which should be a jquery element object
  //targetShips is the array of ships, hits are logged to it.
  function markAttack(targetSquare, targetShips){
    // checks to make sure square hasn't already been attacked. If it has, ignore the attack.
    if(targetSquare.children(".attacks").length === 0){
      let hasShip = "";
      //check if the target square has a ship node in it and if so, add offset to get mark displayed correctly.
      if(targetSquare.children(".ship").length){
        hasShip = "attack-ship-offset";
      }
      let data = targetSquare.data();
      //check to see if there's already an attack marked on the square
      // If not, add new hit or miss
      if(checkHit(getSquareId(data.row, data.column), targetShips)){
        console.log("It's a hit!");
        $("<div>").text("X").addClass(`attacks hit ${hasShip}`).appendTo(targetSquare);
      } else {
        console.log("Miss!");
        $("<div>").text("O").addClass(`attacks miss ${hasShip}`).appendTo(targetSquare);
      }
    }

  }

  // check if square (in A1 format) is a hit on any of ships in ships array.
  // if so, mark square true in ship.squares[position]
  function checkHit(position, ships){
    let result = false;
    // console.log("checking for hit on position " + position);
    // console.dir(ships);
    ships.forEach(function(ship){
      for(square in ship.squares){
        if(position == square){

          //if square hasn't been hit yet (ie check for repeat hits)
          if(ship.squares[square] === false){
            //mark target square as hit
            ship.squares[square] = true;

            //check to see if ship has now sunk
            let sunk = true;
            for(square in ship.squares){
              //check to see if any of the squares is false (ie not sunk).
              if(ship.squares[square] === false){
                sunk = false;
              }
            }

            if(sunk){
              ship.isSunk = true;
              console.log(`${ship.type} hit in square ${square}, position ${position}, and it sinks!`);
              logToTicker(`${ship.type} has sunk`, true);
            }

            console.log(`${ship.type} hit in square ${square}, position ${position}`);
            result = true;

          } else {
            console.log(`Repeat hit on ${ship.type} in square ${square}, position ${position}`)
            result = false;
          }
        }
      }
    });

    return result;

  }

  function setPlayerShips(ships, board){
    let currentShip = null;

    let shipClickHandler = function(event){
      console.log(`Handling click on ship ${$(this).data().shipId}`);
      currentShip = $(this);
      $(".ship").off("click", null);
      move(currentShip);
      event.stopPropagation();
      board.on("click", ".board-square", boardClickHandler);
      $("#rotate").on("click", function(){
        currentShip.toggleClass("rotate90");
      });
      $(document).on("keydown", function(event){
        if(event.which == 82){
          currentShip.toggleClass("rotate90");
          console.log(`R key was pressed, rotating ship`);
        }
      });
    };

    let boardClickHandler = function(){
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
          board.off("click");
          currentShip = null;
          ships.on("click", shipClickHandler);
        }
      }
    };

    ships.on("click", shipClickHandler);

    board.on("click", ".board-square", boardClickHandler);
  }

  // logs message to the on-screen "console", for giving instructions or updating on
  // game progress.
  function logToTicker(message, important){
    // let slices = [];
    // let end = 0;
    // while(end < message.length){
    //   let snipLength = 1 + (Math.random() * 5
    // }
    let $message = $("<div>").text(message);
    if(important){
      $message.addClass("important");
    }
    $message.prependTo($(".console"));
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

      // adds isSunk key, used to track ships sinking
      ship.isSunk = false;

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

    // this removes it from the shipyard div so it doesn't mess with page layout
    // elm.css({position: "absolute"});

    $(document).on("mousemove", function(w){
      // this class is used to keep the ships "small" until placement has started
      elm.removeClass("initial-size");
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
    $("#rotate").off("click", null);

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

  // returns an object of format {row: [0-boardSize), column: [0-boardSize)}
  // where row and column values are picked randomly.
  // optional paramters will place randomly within a limited area (handy for placing ships with known length)
  // maxRow and maxColumn are 0 indexed
  function randomSquare(maxRow, maxColumn){
    const square = { row: null, column: null };

    square.row = Math.floor(Math.random() * ((maxRow + 1) || boardSize));
    square.column = Math.floor(Math.random() * ((maxColumn + 1) || boardSize));

    return square;
  }

});
