## d3-spirograph

This is a d3.js simulation of the classic
[Spirograph toy](https://en.wikipedia.org/wiki/Spirograph).

<img src="https://cloud.githubusercontent.com/assets/227022/12528703/ead2e6f8-c164-11e5-8264-7a8dcdffe819.png">

The application draws an SVG of a
[hypotrochoid curve](https://en.wikipedia.org/wiki/Hypotrochoid)
using multiple `path` elements rather than just one with a stroke and no fill.
It's designed this way so that the resulting SVGs can be converted to
3D-printable files using the
[`paths2openscad` Inkscape extension](https://github.com/l0b0/paths2openscad).
This works better with simpler curves and thicker lines:

<img src="https://cloud.githubusercontent.com/assets/227022/12528752/f81a4764-c166-11e5-9e0b-15fbe4a6189c.png">
