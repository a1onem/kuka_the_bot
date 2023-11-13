// ["drawCommands",[[0,10,40,140,21,140,21]]]  команды рисования: 0 - карандаш (1-ластик,2-заливка), 10(0-21) - цвет, 40(4,9,15,40) - размер, x1,y1,x2,y2



class Canvas {

    constructor(canvas) {

        this.PALETTE = [
            { r: 255, g: 255, b: 255 },
            { r: 0, g: 0, b: 0 },
            { r: 193, g: 193, b: 193 },
            { r: 80, g: 80, b: 80 },
            { r: 239, g: 19, b: 11 },
            { r: 116, g: 11, b: 7 },
            { r: 255, g: 113, b: 0 },
            { r: 194, g: 56, b: 0 },
            { r: 255, g: 228, b: 0 },
            { r: 232, g: 162, b: 0 },
            { r: 0, g: 204, b: 0 },
            { r: 0, g: 70, b: 25 },
            { r: 0, g: 255, b: 145 },
            { r: 0, g: 120, b: 93 },
            { r: 0, g: 178, b: 255 },
            { r: 0, g: 86, b: 158 },
            { r: 35, g: 31, b: 211 },
            { r: 14, g: 8, b: 101 },
            { r: 163, g: 0, b: 186 },
            { r: 85, g: 0, b: 105 },
            { r: 223, g: 105, b: 167 },
            { r: 135, g: 53, b: 84 },
            { r: 255, g: 172, b: 142 },
            { r: 204, g: 119, b: 77 },
            { r: 160, g: 82, b: 45 },
            { r: 99, g: 48, b: 13 }
        ];

        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        // this.ctx.imageSmoothingEnabled = false;

        this.cw = this.canvas.width;
        this.ch = this.canvas.height;
    }

    clear = () => {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.cw, this.ch);
    }


    drawCommands = commands => commands.forEach(cmd => {

        if (cmd[0] == '0') {

            let width = Math.floor(cmd[2]);
            if (width < 4) width = 4;
            if (width > 40) width = 40;
            let n = Math.floor(Math.ceil(width / 2));
            let x1 = this.i(Math.floor(cmd[3]), -n, this.cw + n),
                y1 = this.i(Math.floor(cmd[4]), -n, this.ch + n),
                x2 = this.i(Math.floor(cmd[5]), -n, this.cw + n),
                y2 = this.i(Math.floor(cmd[6]), -n, this.ch + n);
            let color = this.PALETTE[cmd[1]];

            this.plotLine(x1, y1, x2, y2, width, color.r, color.g, color.b);
        }

        if (cmd[0] == '1') {

            let color = this.PALETTE[cmd[1]];
            let x = this.i(Math.floor(cmd[2]), 0, this.cw), y = this.i(Math.floor(cmd[3]), 0, this.ch);

            this.floodFill(x, y, color.r, color.g, color.b);
        }
    });



    i = (t, e, n) => t < e ? e : t > n ? n : t


    setPixel = (t, e, n, o, r) => {
        e >= 0 && e < t.data.length && (t.data[e] = n, t.data[e + 1] = o, t.data[e + 2] = r,
            t.data[e + 3] = 255);
    }

    getPixel = (t, e, n) => {
        let o = 4 * (n * t.width + e);
        return o >= 0 && o < t.data.length ? [t.data[o], t.data[o + 1], t.data[o + 2]] : [0, 0, 0];
    }

    plotLine = (t, e, n, o, r, s, i, a) => {
        let c = Math.floor(r / 2),
            u = c * c,
            h = Math.min(t, n) - c,
            l = Math.min(e, o) - c,
            p = Math.max(t, n) + c,
            f = Math.max(e, o) + c;
        t -= h, e -= l, n -= h, o -= l;
        let d = this.ctx.getImageData(h, l, p - h, f - l),
            y = function (t, e) {
                for (let n = -c; n <= c; n++)
                    for (let o = -c; o <= c; o++)
                        if (n * n + o * o < u) {
                            let r = 4 * ((e + o) * d.width + t + n);
                            r >= 0 && r < d.data.length && (d.data[r] = s, d.data[r + 1] = i, d.data[r + 2] = a,
                                d.data[r + 3] = 255);
                        }
            };
        if (t == n && e == o) y(t, e);
        else {
            y(t, e), y(n, o);
            let m = Math.abs(n - t),
                g = Math.abs(o - e),
                v = t < n ? 1 : -1,
                b = e < o ? 1 : -1,
                w = m - g;
            for (Math.floor(Math.max(0, c - 10) / 5); t != n || e != o;) {
                let k = w << 1;
                k > -g && (w -= g, t += v), k < m && (w += m, e += b), y(t, e);
            }
        }

        this.ctx.putImageData(d, h, l);
    }


    floodFill = (t, e, n, o, r) => {

        let s = this.ctx.getImageData(0, 0, this.cw, this.ch), i = [[t, e]], a = this.getPixel(s, t, e);

        if (n != a[0] || o != a[1] || r != a[2]) {
            for (let c = function (t) {
                let e = s.data[t], i = s.data[t + 1], c = s.data[t + 2];
                if (e == n && i == o && c == r) return !1;
                let u = Math.abs(e - a[0]), h = Math.abs(i - a[1]), l = Math.abs(c - a[2]);
                return u < 1 && h < 1 && l < 1;
            }, u = s.height, h = s.width; i.length;) {
                let l, p, f, d, y, m;
                for (l = i.pop(), p = l[0], f = l[1], d = 4 * (f * h + p); f-- >= 0 && c(d);) d -= 4 * h;
                for (d += 4 * h, ++f, y = !1, m = !1; f++ < u - 1 && c(d);) this.setPixel(s, d, n, o, r),
                    p > 0 && (c(d - 4) ? y || (i.push([p - 1, f]), y = !0) : y && (y = !1)), p < h - 1 && (c(d + 4) ? m || (i.push([p + 1, f]),
                        m = !0) : m && (m = !1)), d += 4 * h;
            }
            this.ctx.putImageData(s, 0, 0);
        }
    }

}