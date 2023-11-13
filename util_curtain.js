class Curtain {

    constructor(color1, color2, type) {
        this.color1 = color1;
        this.color2 = color2;
        this.type = type;
    }

    makePoints() {

        let points = [];

        if (this.type == 1) {

            for (let i = 5; i <= 400; i += 10) {
                points.push([0, this.color1, 12, i, 0, i, 600], [0, this.color1, 12, 800 - i, 0, 800 - i, 600]);
            }
            for (let i = 5; i <= 400; i += 10) {
                points.push([0, this.color2, 12, 400 - i, 0, 400 - i, 600], [0, this.color2, 12, 400 + i, 0, 400 + i, 600]);
            }

        } else {

            for (let i = 5; i <= 300; i += 10) {
                points.push([0, this.color1, 12, 0, i, 800, i], [0, this.color1, 12, 0, 600 - i, 800, 600 - i]);
            }
            for (let i = 5; i <= 300; i += 10) {
                points.push([0, this.color2, 12, 0, 300 - i, 800, 300 - i], [0, this.color2, 12, 0, 300 + i, 800, 300 + i]);
            }
        }

        return points;
    }
}