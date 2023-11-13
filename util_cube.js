class Cube {

    constructor() {
    }


    makePoints() {

        let points = [];
        let cube_points = [
            [-1, -1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1]
        ];
        let th = Math.random() * 2 - 1;
        let th2 = Math.random() < .5 ? 1 : -1;
        let distance = 1.5;
        let W = 600;


        for (let i = 0; i < 2; i += 0.1) {

            let proj_points = [];

            for (let point of cube_points) {

                // вращение
                point = this.rotateY(point, i * th2);
                point = this.rotateX(point, i * th);

                // перспектива
                let x = point[0] / (point[2] + 4), y = point[1] / (point[2] + 4);

                // проекция на плоскость
                proj_points.push([W * (x + distance) / (2 * distance) + 100, W * (1 - (y + distance) / (2 * distance))]);
            }

            for (let j = 1; j >= 0; j--) {

                for (let k = 0; k < 4; k++) {
                    points.push(
                        [0, j, 4, proj_points[k][0], proj_points[k][1], proj_points[(k + 1) % 4][0], proj_points[(k + 1) % 4][1]],
                        [0, j, 4, proj_points[k + 4][0], proj_points[k + 4][1], proj_points[((k + 1) % 4) + 4][0], proj_points[((k + 1) % 4) + 4][1]],
                        [0, j, 4, proj_points[k][0], proj_points[k][1], proj_points[k + 4][0], proj_points[k + 4][1]]
                    );
                }
            }

            distance -= 0.05;
        }

        return points;
    }


    rotateY = (point, theta) => {
        let x = point[0], y = point[1], z = point[2];

        return [
            Math.cos(theta) * x - Math.sin(theta) * z,
            y,
            Math.sin(theta) * x + Math.cos(theta) * z
        ];
    }

    rotateX = (point, theta) => {
        let x = point[0], y = point[1], z = point[2];

        return [
            x,
            Math.cos(theta) * y - Math.sin(theta) * z,
            Math.sin(theta) * y + Math.cos(theta) * z
        ];
    }
}