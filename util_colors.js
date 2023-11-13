class Colors {

    constructor() {

    }

    makePoints() {

        let points = [];
        let col;

        for (let i = 0; i < 20; i++) {

            col = i;

            for (let y = 200; y < 400; y += 40) {
                for (let x = 300; x < 500; x += 40) {
                    points.push([0, i == 19 ? 0 : col % 26, i == 19 ? 40 : 40 - i * Math.random(), x, y, x, y]);
                    col++;
                }

            }
        }

        return points;

    }
}