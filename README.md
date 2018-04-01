# Battleship

A browser based re-imagining of the classic game, with CSS and jQuery.

Built as an extra challenge project as part of the Lighthouse Labs web development bootcamp.

## Features

- Single Player against AI enemy
- Ship can be positioned with mouse, and rotated by pushing `r` or clicking the `rotate` button.
- Ships can be placed randomly with `randomize` button
- Enemy will guess at random until something is hit, then will use somewhat intelligent guessing to narrow in on the target.
- Launch a recon plane: triple-click the on-screen console and the enemy ships will be displayed. Triple-click again to hide.

## Getting Started

1. Just visit https://thelornenelson.github.io/battleship/index.html

## Future plans

- Improve AI guessing to intelligently deal with the case where a 2nd ship is found while trying to sink a first ship. Currently this doesn't trigger anything special and after sinking either ship then AI will revert to random guessing until a new ship is found.
- Spice up the console messages. Add a bit of banter.
- Add more options. The code itself will support up to 26x26 boards and no particular limit on ships, just need to implement the interface.

## Dependencies

- loads jQuery from Google CDN
