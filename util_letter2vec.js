class Letter2Vec {

    constructor(letters, x, y, scale, width, color) {

        this.letters = letters;
        this.x = x;
        this.y = y;
        this.scale = scale || 1;
        this.width = width || 1;
        this.color = color || 1;
    }

    makePoints() {

        let points = [], s = this.x;

        for (let letter of this.letters) {

            if (letter == " ") {
                s += 40 * this.scale;

            } else {

                let vecs = this.vectors[letter];

                for (let vec of vecs) {
                    points.push([0, this.color, this.width, vec[0] * this.scale + this.x + s, vec[1] * this.scale + this.y, vec[2] * this.scale + this.x + s, vec[3] * this.scale + this.y]);
                }

                s += 40 * this.scale;
            }
        }
        
        return points;
    }

    vectors = {
        "t": [[0, 0, 30, 0], [15, 0, 15, 40]],
        "h": [[0, 0, 0, 40], [0, 20, 30, 20], [30, 0, 30, 40]],
        "e": [[0, 0, 0, 40], [0, 0, 30, 0], [0, 20, 30, 20], [0, 40, 30, 40]],
        "s": [[0, 0, 30, 0], [0, 0, 0, 20], [0, 20, 30, 20], [30, 20, 30, 40], [0, 40, 30, 40]],
        "m": [[0, 0, 0, 40], [0, 0, 15, 15], [15, 15, 30, 0], [30, 0, 30, 40]],
        "a": [[0, 0, 30, 0], [0, 0, 0, 40], [0, 20, 30, 20], [30, 0, 30, 40]],
        "r": [[0, 0, 30, 0], [0, 0, 0, 40], [30, 0, 30, 20], [0, 20, 30, 20], [0, 20, 30, 40]],
        "p": [[0, 0, 0, 40], [0, 0, 30, 0], [30, 0, 30, 20], [0, 20, 30, 20]],
        "l": [[0, 0, 0, 40], [0, 40, 30, 40]],
        "y": [[0, 0, 15, 15], [15, 15, 30, 0], [15, 15, 15, 40]],
        "i": [[0, 0, 30, 0], [15, 0, 15, 40], [0, 40, 30, 40]]
    }
}