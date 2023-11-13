class loadingBar {

    constructor() { }

    makePoints() {

        let points = [];
        const colors = [4, 6, 8, 10, 12, 14, 16, 18];
        let col = colors[Math.random() * colors.length | 0];

        points.push(
            [0, 1, 6, 100, 284, 699, 284],
            [0, 1, 6, 699, 284, 699, 317],
            [0, 1, 6, 699, 317, 100, 317],
            [0, 1, 6, 100, 317, 100, 284]
        );

        for (let i = 104; i < 698; i += 3) {
            points.push([0, col, 1, i, 288, i, 313]);
        }

        for (let i = 108; i < 698; i += 39) {
            points.push([0, 0, 40, i, 288, i, 313]);
        }

        return points;
    }
}