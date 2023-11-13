class Spiral {

    constructor() {

    }

    makePoints() {

        let step = 16, l, col;
        let x1, y1, x2, y2, x3, y3, x4, y4;
        let points = [];
        let cx = 400, cy = 300;

        for (let j = 0; j < 2; j++) {

            col = 4;

            for (let k = 0; k < 2; k++) {

                l = step;

                for (let i = 0; i < 14; i++) {

                    x1 = cx - l, y1 = cy - l;
                    x2 = cx + l, y2 = cy - l;
                    x3 = cx + l, y3 = cy + l;
                    x4 = cx - l, y4 = cy + l;

                    col = k == 0 ? col % 21 : 0

                    points.push(
                        [0, col, 20, x1, y1, x2, y2],
                        [0, col, 20, x2, y2, x3, y3],
                        [0, col, 20, x3, y3, x4, y4],
                        [0, col, 20, x4, y4, x1, y1]
                    );

                    col++;

                    l += step;
                }
            }

            step += 10;
        }

        return points;
    }
}