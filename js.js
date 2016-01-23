'use strict';

const params = {
    // Graph parameters
    tMin  : 0,
    tMax  : 160,
    tStep : .1,
    xMin  : -10,
    xMax  : 10,
    yMin  : -10,
    yMax  : 10,

    // Display parameters
    lineWidth  : 4,
    renderTime : 800,

    // Hypotrochoid parameters
    R : 4.6,
    r : 2.5,
    d : 8,
};

function hypotrochoidX(t) {
    return (
        (params.R - params.r) * Math.cos(t)
        + params.d * Math.cos((params.R - params.r) / params.r * t)
    );
}

function hypotrochoidY(t) {
    return (
        (params.R - params.r) * Math.sin(t)
        - params.d * Math.sin((params.R - params.r) / params.r * t)
    );
}

function asyncFor(start, end, step, cb, done) {
    function loop(i) {
        cb(i, function() {
            i += step;
            if (i < end) {
                loop(i);
            } else if (typeof done === 'function') {
                done();
            }
        });
    }

    loop(start);
}

let lastParams = {};

function redrawIfNeeded() {
    // TODO cancel any in-progress redraw
    for (let k in params) {
        if (params[k] !== lastParams[k]) {
            redraw();
            break;
        }
    }
    lastParams = JSON.parse(JSON.stringify(params));
}

function redraw() {
    d3.selectAll('#graph svg').remove();

    d3.select('#render-progress').classed('hide', false);

    const m = [20, 20, 20, 20]; // margins
    const w = 600 - m[1] - m[3]; // width
    const h = 600 - m[0] - m[2]; // height

    const xScale = d3.scale.linear().domain([params.xMin, params.xMax]).range([0, w]);

    const yScale = d3.scale.linear().domain([params.yMin, params.yMax]).range([h, 0]);

    // Add an SVG element with the desired dimensions and margin.
    const graph = d3.select('#graph').append('svg')
        .attr('width', w + m[1] + m[3])
        .attr('height', h + m[0] + m[2])
      .append('g')
        .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')');

    const line = d3.svg.line()
        .x(d => d.x)
        .y(d => d.y);

    const startAt = +new Date;
    const numSteps = (params.tMax - params.tMin) / params.tStep;
    let currentStep = 0;

    // TODO there are tons of duplicate calculations here
    // TODO adaptive rendering: http://scicomp.stackexchange.com/questions/2377/algorithms-for-adaptive-function-plotting
    // TODO handle horizontal/vertical sections (infinite slope = sadness)
    asyncFor(params.tMin, params.tMax, params.tStep, (t, next) => {
        const xLast = xScale(hypotrochoidX(t - params.tStep)),
            yLast = yScale(hypotrochoidY(t - params.tStep)),
            xCurr = xScale(hypotrochoidX(t)),
            yCurr = yScale(hypotrochoidY(t)),
            xNext = xScale(hypotrochoidX(t + params.tStep)),
            yNext = yScale(hypotrochoidY(t + params.tStep)),
            xNext2 = xScale(hypotrochoidX(t + 2 * params.tStep)),
            yNext2 = yScale(hypotrochoidY(t + 2 * params.tStep)),
            slopeCurr = (yNext - yLast) / (xNext - xLast),
            slopeNext = (yNext2 - yCurr) / (xNext2 - xCurr);
        let rect = [
            {
                x : xCurr + params.lineWidth / 2 * Math.cos(Math.atan(-1 / slopeCurr)),
                y : yCurr + params.lineWidth / 2 * Math.sin(Math.atan(-1 / slopeCurr))
            }, {
                x : xNext + params.lineWidth / 2 * Math.cos(Math.atan(-1 / slopeNext)),
                y : yNext + params.lineWidth / 2 * Math.sin(Math.atan(-1 / slopeNext))
            }, {
                x : xNext - params.lineWidth / 2 * Math.cos(Math.atan(-1 / slopeNext)),
                y : yNext - params.lineWidth / 2 * Math.sin(Math.atan(-1 / slopeNext))
            }, {
                x : xCurr - params.lineWidth / 2 * Math.cos(Math.atan(-1 / slopeCurr)),
                y : yCurr - params.lineWidth / 2 * Math.sin(Math.atan(-1 / slopeCurr))
            }
        ];
        // Meh, something weird was happening at horizontal sections where the
        // slope crosses from positive to negative
        if (
            (slopeCurr > 0) !== (slopeNext > 0) &&
            Math.abs(slopeCurr) < 1 &&
            Math.abs(slopeNext) < 1
        ) {
            rect = [
                rect[0],
                rect[2],
                rect[1],
                rect[3]
            ];
        }
        const path = graph.append('path')
            .classed('quadrilateral', true)
            .attr('d', line(rect));

        currentStep++;
        d3.select('#render-progress .bar')
            .style('width', 100 * currentStep / numSteps + '%')
        d3.select('#render-progress .text')
            .text(Math.round(t * 100) / 100);

        const expectedTime = startAt + (params.renderTime * currentStep / numSteps);
        const actualTime = +new Date;
        if (actualTime < expectedTime) {
            setTimeout(next, expectedTime - actualTime);
        } else {
            try {
                next();
            } catch (ex) {
                // Probably a stack overflow
                setTimeout(next, 0);
            }
        }
    }, () => {
        d3.select('#render-progress').classed('hide', true);
    });
}

const gui = new dat.GUI();

Object.keys(params).forEach(k => {
    gui.add(params, k).onChange(redrawIfNeeded);
});

d3.select('#unsupported-browser').remove();

redraw();
