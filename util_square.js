class Square {

    constructor(cx, cy, size, width, color) {
        this.cx = cx;
        this.cy = cy;
        this.size = size;
        this.width = width;
        this.color = color;
    }

    makePoints() {

        let points = [];

        let x1 = this.cx - this.size, y1 = this.cy - this.size;
        let x2 = this.cx + this.size, y2 = this.cy - this.size;
        let x3 = this.cx + this.size, y3 = this.cy + this.size;
        let x4 = this.cx - this.size, y4 = this.cy + this.size;

        let a = 0.67;

        for (let i = 0; i < 25; i++) {

            let point1 = this.rotate(x1, y1, a);
            x1 = point1.x;
            y1 = point1.y;

            let point2 = this.rotate(x2, y2, a);
            x2 = point2.x;
            y2 = point2.y;

            let point3 = this.rotate(x3, y3, a);
            x3 = point3.x;
            y3 = point3.y;

            let point4 = this.rotate(x4, y4, a);
            x4 = point4.x;
            y4 = point4.y;

            points.push(
                [0, this.color, this.width, x1, y1, x2, y2],
                [0, this.color, this.width, x2, y2, x3, y3],
                [0, this.color, this.width, x3, y3, x4, y4],
                [0, this.color, this.width, x4, y4, x1, y1]
            );
        }

        return points;
    }

    rotate(x, y, a) {

        let tempX = x - this.cx;
        let tempY = y - this.cy;

        let rotatedX = tempX * Math.cos(a) - tempY * Math.sin(a);
        let rotatedY = tempX * Math.sin(a) + tempY * Math.cos(a);

        return { x: rotatedX + this.cx, y: rotatedY + this.cy }
    }
}