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

  const enemyTargets = [];
  const enemyGuesses = [];

  // set size of board (boardSize x boardSize squares)
  // accessed directly by many functions.
  let boardSize = 10;

  // generate player board and enemy board/shot tracker and insert into DOM
  createBoard($("#player-board").find(".board"), "player-");
  createBoard($("#enemy-board").find(".board"), "enemy-");

  // initiate player ship placement (allow click and move on ships)
  setPlayerShips($(".ship"), $("#player-board"));

  // sets the enemy ships (nothing visual, just adds positions to enemyShips array)
  autoSetShips(enemyShips, "enemy");

  // enter "cheater mode" when console is triple-clicked;
  $(".console").on("click", function(event){
    if(event.detail == 3){
      toggleEnemyShips(enemyShips);
    }
  });

  // Button handler for "begin", start game if ships are ready, otherwise give further instruction.
  $("#begin").on("click", function(){
    if(areShipsReady(myShips)){
      areShipsReady(enemyShips);
      // this removes the pointer and hover effect
      $(`.player.ship.movable`).removeClass("movable");

      $(".commands, .shipyard").remove();
      logToTicker("Game On! Pick a target square.");

      attack();
    } else {
      logToTicker("Hold on, your ships aren't in position");
    }
  });

  // Button handler for "randomize"
  $("#randomize").on("click", function(){
    autoSetShips(myShips, "player");
  });

  // logs message to the on-screen "console", for giving instructions or updating on
  // game progress.
  function logToTicker(message, important){

    let output = "";
    let slices = [];
    let sliceStart = 0;
    let minWord = 2;
    let maxWord = 8;
    let minDelay = 50;
    let maxDelay = 200;

    while(sliceStart < message.length){
      let sliceLength = Math.round((Math.random() * (maxWord - minWord))) + minWord
      slices.push(message.substring(sliceStart, sliceStart + sliceLength));
      sliceStart += sliceLength;
    }

    let $message = $("<div>");

    if(important){
      $message.addClass("important");
    }
    $message.prependTo($(".console"));

    let sliceIndex = 0;

    outputSlice();

    function outputSlice(){
      if(sliceIndex < slices.length) {
        let delay = Math.round(Math.random() * (maxDelay - minDelay)) + minDelay;
        output += slices[sliceIndex];
        $message.text(output);
        sliceIndex++;
        setTimeout(outputSlice, delay);
      }
    }
  }

  // function to handle player's attack turn.
  function attack(){
    $("#enemy-board .board-header, #enemy-board .board").addClass("active");

    $("#enemy-board").on("click", ".board-square", function(){
      // only process click if there are no previous attacks on square.
      if($(this).children(".attacks").length === 0){
        let target = $(this).data();
        let message = `You attack ${getSquareId(target.row, target.column)}`;
        let attackOutcome = markAttack($(this), enemyShips);
        if(attackOutcome.hit){
          message += ` and it's a hit!`;
          if(attackOutcome.sink){
            message += ` Enemy ${attackOutcome.sink} sinks!`;
          }
        } else {
          message += ` but there's nothing there!`;
        }
        logToTicker(message, attackOutcome.hit);
        $("#enemy-board").off("click", null);
        $("#enemy-board .board-header, #enemy-board .board").removeClass("active");
        if(areAllSunk(enemyShips)){
          window.setTimeout(logToTicker, 1500, `You Win!`, true);
        } else {
          window.setTimeout(enemyAttack, 2000);
        }
      }
    });
  }

  // when called, AI will determine where to attack, determine result of attack, and plot results of attack on your board.
  function enemyAttack(){
    let target = undefined;
    let knownTarget = false;
    if(enemyTargets[0]){
      // if any targets defined, set target to the next target in queue
      // enemyTargets[0] is always the next target search (set of up to 4 directions to search in);
      // enemyTargets[0][0] is the first direction to try
      // enemyTargets[0][0][0] is the first target to try.
      // targets or target directions will be removed as tried or proven invalid to keep the [0][0][0] item current.

      // this makes sure enemyTargets[0][0] is defined and if not, picks a random square.
      target = enemyTargets[0][0] && enemyTargets[0][0][0];
      if(!target){
        target = randomSquare(undefined, undefined, enemyGuesses);
      }
      // target is object of form {row: row, column: column};
      knownTarget = true;
    } else {
      target = randomSquare(undefined, undefined, enemyGuesses);
    };

    let message = `Enemy attacks ${getSquareId(target.row, target.column)}`;
    enemyGuesses.push(target);

    let attackOutcome = markAttack($(`#player-${getSquareId(target.row, target.column)}`), myShips);
    
    if(attackOutcome.sink){
      // enemy sinks one of your ships
      // remove current targeting strategy;
      enemyTargets.shift();
      message += ` sinking your ${attackOutcome.sink}`;

    } else if(attackOutcome.hit){
      if(!knownTarget){
        setTargetsAfterHit(target.row, target.column);
      } else {
        if(enemyTargets[0][0].length > 1){
          // shifts next target to enemyTarget[0][0][0], if there's another target in this direction.
          enemyTargets[0][0].shift();
        } else {
          // otherwise starts guessing the next direction.
          enemyTargets[0].shift();
        }
      }
      // enemy get a hit but doesn't sink anything
      message += ` and hits your ${attackOutcome.hit}!`;

    } else {
      if(knownTarget){
        // if we targetted a specific direction but missed
        // shifts next target direction to enemyTargets[0][0]
        enemyTargets[0].shift();
      }
      message += ` but misses!`;
    }
    logToTicker(message, attackOutcome.hit);

    if(areAllSunk(myShips)){
      logToTicker(`The Enemy has sunk your ships! Game Over!`, true);
    } else {
      window.setTimeout(attack, 1);
    }
  }

  // adds enemyTargets for 4 points surrounding a hit, if valid.
  function setTargetsAfterHit(hitRow, hitColumn){

    let newTargets = [];
    // down, up, left, right.
    let directions = [{dRow: 1, dColumn: 0}, {dRow: -1, dColumn: 0}, {dRow: 0, dColumn: -1}, {dRow: 0, dColumn: 1}];

    // change up order of guessing, but keep axes adjacent so if it guesses in the middle, then works to one end of ship, it'll move along the same axis rather than potentially going off sideways, which wouldn't make much sense.
    if(Math.round(Math.random())){
      directions.push(directions.shift());
      directions.push(directions.shift());
    }

    let nextTargetsIndex = 0;
    directions.forEach(function(direction, index){
      let anyValidTargets = false;
      let rowValid = true;
      let columnValid = true;
      let previousTarget = {row: hitRow, column: hitColumn};
      while(rowValid && columnValid){

        let newTarget = {row: previousTarget.row + direction.dRow, column: previousTarget.column + direction.dColumn};
        previousTarget = {row: newTarget.row, column: newTarget.column};

        rowValid = newTarget.row < boardSize && newTarget.row >= 0;
        columnValid = newTarget.column < boardSize && newTarget.column >= 0;

         // this is a bit of a hack but will check against previous guesses and skip direction if there's already a guess
        enemyGuesses.forEach(function(excludedSquare){
          if(newTarget.row === excludedSquare.row && newTarget.column === excludedSquare.column){
            rowValid = false;
            columnValid = false;
          }
        });

        if(rowValid && columnValid){
          anyValidTargets = true;
          if(!newTargets[nextTargetsIndex]){
            newTargets[nextTargetsIndex] = [];
          }
          newTargets[nextTargetsIndex].push(newTarget);
        }
      }
      if(anyValidTargets) {
        nextTargetsIndex++;
      }

    });
    enemyTargets.push(newTargets);

  }

  function areAllSunk(ships){
    result = true;
    ships.forEach(function(ship){
      if(ship.isSunk === false){
        result = false;
      }
    });
    return result;
  }
  // function to place ships at random on board
  function autoSetShips(ships, player){
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
      }
    });
  }

  function toggleEnemyShips(ships){

    // select enemy ships, if any exist in DOM
    let $ships = $(".enemy.ship");
    if($ships.length > 0){
      // if any ships exist, remove them
      ships.forEach(function(ship){
        $(`#enemy-${ship.position} .attacks`).removeClass("attack-ship-offset");
      });
      $ships.remove();
    } else {
      // otherwise create dom nodes to show ships.
      ships.forEach(function(ship){
        let $ship = makeShip(ship.type, "enemy", ship.angle);
        $(`#enemy-${ship.position} .attacks`).addClass("attack-ship-offset");
        fix($ship, $(`#enemy-${ship.position}`))
      });
    }
  }

  // creates and returns a jQuery element to represent a ship as described by the parameters passed
  function makeShip(type, player, angle){
    let ship = $("<div>");
    ship.addClass(`${player} ship ${type.toLowerCase()}`);
    ship.text(type);
    if(angle === 90){
      ship.addClass("rotate90");
    }
    return ship;
  }

  //marks attack on targetSquare, which should be a jquery element object
  //targetShips is the array of ships, hits are logged to it.
  function markAttack(targetSquare, targetShips){
    // checks to make sure square hasn't already been attacked. If it has, ignore the attack.
    if(targetSquare.children(".attacks").length === 0){
      let hasShip = "";
      //check if the target square has a ship node in it and if so, add offset to get mark displayed correctly.
      if(targetSquare.children(".ship").length > 0){
        hasShip = "attack-ship-offset";
      }
      let data = targetSquare.data();
      //check to see if there's already an attack marked on the square
      // If not, add new hit or miss
      let attackOutcome = checkHit(getSquareId(data.row, data.column), targetShips);
      if(attackOutcome.hit){
        $("<div>").text("X").addClass(`attacks hit ${hasShip}`).appendTo(targetSquare);
        return attackOutcome;
      } else {
        $("<div>").text("O").addClass(`attacks miss ${hasShip}`).appendTo(targetSquare);
        return attackOutcome;
      }
    }

  }

  // check if square (in A1 format) is a hit on any of ships in ships array.
  // if so, mark square true in ship.squares[position]
  function checkHit(position, ships){
    let result = {hit: false, sink: false};
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
              result.sink = ship.type;
            }

            result.hit = ship.type;

          } else {
            result.hit = false;
          }
        }
      }
    });

    return result;

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
    if(ship.position === null || ship.row === null || ship.column === null){
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

  // allows player to place ships by selecting ship and clicking to place on board
  function setPlayerShips(ships, board){
    let currentShip = null;

    let shipClickHandler = function(event){
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

  // return offset corrections to shift ship to cursor when rotated
  function calcRotationPositionCorr(elm){
    return {xCorr: elm.width() / -2, yCorr: elm.width() / 2 };
  }

  // ties jQuery object elm to move with the mouse cursor
  function move(elm){

    $(document).on("mousemove", function(w){
      // this class is used to keep the ships "small" until placement has started
      elm.removeClass("initial-size");
      //check if element is rotated, and apply position corrections
      let corr = {xCorr: 0, yCorr: 0};
      if(elm.hasClass("rotate90")){
        corr = calcRotationPositionCorr(elm);
      }
      elm.removeClass("ship-position");
      elm.css({
         position: "absolute",
         left:  w.pageX + corr.xCorr,
         top:   w.pageY + corr.yCorr
      });
    });
  }

  // fixes element by appending to parent and unbinds mousemove event
  function fix(elm, parent){
    $(document).off("mousemove", null);
    $(document).off("keydown", null);
    $("#rotate").off("click", null);

    if(parent.children(".attacks").length){
      elm.insertBefore(parent.children(".attacks").first())
    } else {
      elm.appendTo(parent);
    }


    // remove any previous in-line css (ie from previous placements)
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

  // creates div elements for boardSize x boardSize board and replaces placeholder elm with newly generated board
  function createBoard(elm, idPrefix){
    let board = $("<div>").addClass("board").css({"grid-template-columns": `repeat(${boardSize}, 2.5em)`});
    for(let i = 0; i < boardSize; i++){
      for(let j = 0; j < boardSize; j++){
        // let currentSquare = $("<div>").attr("id", `${idPrefix}${colTag(j)}${i + 1}`).data({column: j, row: i}).addClass("board-square")
        // $("<span>").text(`${colTag(j)}${i + 1}`).appendTo(currentSquare);
        // currentSquare.appendTo(board);

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
    return `${colTag(column)}${row + 1}`;
  }

  // returns an object of format {row: [0-boardSize), column: [0-boardSize)}
  // where row and column values are picked randomly.
  // optional parameters will place randomly within a limited area (handy for placing ships with known length)
  // maxRow and maxColumn are 0 indexed, so maxRow 9, maxColumn 9 will place anywhere on a 10 x 10 board;
  // optional exclude array of objects in form {row: row, column: column} to exclude squares from random selection.
  function randomSquare(maxRow, maxColumn, exclude){
    const square = { row: null, column: null };
    let allowed = false;

    while(!allowed){
      allowed = true;
      square.row = Math.floor(Math.random() * ((maxRow + 1) || boardSize));
      square.column = Math.floor(Math.random() * ((maxColumn + 1) || boardSize));
      if(exclude){
        exclude.forEach(function(excludedSquare){
          if(square.row === excludedSquare.row && square.column === excludedSquare.column){
            allowed = false;
          }
        });
      }
    }

    return square;
  }

});
