# slimy-snake
**Slither.io Snake Whisperer (Bot)**

## Table of Contents
- [Intro](https://github.com/jfbarras/slimy-snake#intro)
- [Repieced features](https://github.com/jfbarras/slimy-snake#repieced-features)
- [New features](https://github.com/jfbarras/slimy-snake#new-features)
- [Controls](https://github.com/jfbarras/slimy-snake#controls)

## Intro
I'm reconstructing "alexzeit/Slither.io-bot-1" piece by piece and reviewing my math & trigonometry as I go.

This is a bot with a long and interesting history. Go check out the these repos, these 20+ contributors are the real wizards. 
- https://github.com/ErmiyaEskandary/Slither.io-bot
- https://github.com/j-c-m/Slither.io-bot
- https://github.com/alexzeit/Slither.io-bot-1

This is mostly me tinkering with this bot, but I'll be attemping to:
- Give the code an improved structure.
- Turn features on/off, off/low/med/high.
- Give the player control over what happens.

## Repieced Features
Zoom with mouse wheel; reset with **Z**. Zoom does not creep back to default; it is maintained to desired level.

Frame rate (FPS) and position are displayed in an overlay, in the bottom right quadrant.

Mobile rendering, **good when experiencing lag**, can be toggled with **O**.

Preferences, like mobile rendering, are displayed in an overlay, in the top left quadrant.

Messages can be written to the development console **(F12)**. Logging can be toggled with **U**.

Preferences, like logging, can be persisted across reboots.

Overlays, like preferences or FPS, can be toggled with **H**.

Statistics, like the top ten scores this session, are displayed in a mid-left overlay.

Visual debugging, like food collection sector and snake turn radius, can be toggled with **Y**.

## New Features
Statistics and visual debugging are available even if the player fully controls the snake.

Four levels of visual debugging are planned: off, low, med, high.

Numeric pad changes absolute heading. For example, **6** make the snake go east.

## Controls
Key | Result
:---|:---
Y	| Visual debugging
U	| Log debugging
O | Mobile rendering
H | Hide overlays
Z | Reset zoom
Space | Speed boost

Num | Result
:---|:---
1	| southwest
3 | southeast
7 | northwest
9	| northeast

Mouse | Result
:---|:---
Click | Speed boost
Wheel | Zoom in/out
