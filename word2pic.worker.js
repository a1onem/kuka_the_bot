// слова, к которым не надо добавлять "cartoon"
const EXCEPTIONS = /^(?:angelina jolie|audience|antelope|bad|bible|brand|brazil|catalog|chestplate|clay|chrome|copper|cuba|display|discord|echo|facebook|figurine|france|freckles|frostbite|funny|google|greece|hippie|horizon|israel|india|jackie chan|kim jong-un|lady gaga|landlord|lane|line|mascot|minotaur|mtv|mrbeast|new|new zealand|neighbor|netherlands|notch|pendulum|photoshop|power bank|russia|romania|reddit|samsung|sapphire|scotland|sculpture|shallow|shoehorn|slam|spain|spoiler|stalin|steam|studio|tabletop|tip|vitamin|warehouse|wall|wingnut|wrapping|w-lan|youtube)$/i;

const cw = 800, ch = 600;
const bw = 266, bh = 200;

const canvas = new OffscreenCanvas(cw, ch);
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const buffer = new OffscreenCanvas(bw, bh);
const ctxHidden = buffer.getContext('2d');

let fontFace1 = new FontFace('Comic Sans MS', 'local("Comic Sans MS")');
self.fonts.add(fontFace1);
fontFace1.load();

let fontFace2 = new FontFace('Calibri', 'local("Calibri")');
self.fonts.add(fontFace2);
fontFace2.load();

const PALETTE = [
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


let found = [], imgid = -1, preurl = null, imgres = [], step = 3, dithering = false, ignorewhite = true, sort_method = 'ordered', dest = null;

const parsePage = (page, reg) => [...page.matchAll(reg)].flatMap(i => i[1]);



onmessage = async e => {

    dest = e.data.dest;

    // Картинка Куки
    if (e.data.word == '#') {

        sort_method = "ordered";
        ignorewhite = true;
        step = e.data.step;

        let resp = await fetch(`img/${e.data.src}.png`);
        let blob = await resp.blob();
        let img = await createImageBitmap(blob);

        ctx.drawImage(img, e.data.x, e.data.y);
        getPoints();

        // Надписи
    } else if (e.data.word == '@') {

        sort_method = "raw";
        ignorewhite = false;
        step = 1;

        let data = e.data.d.split('|');

        let txt = data[0];
        let x = data[1];
        let y = data[2];

        let size = data[3];
        let color = data[4];
        let style = data[5];

        let font = data[6] || 'Comic Sans MS';

        ctx.font = `${style} ${size}px "${font}"`;
        ctx.fillStyle = color;
        ctx.fillText(txt, x, y);
        // ctx.strokeStyle = '#000';
        // ctx.lineWidth = 2.5;
        // ctx.strokeText(txt, x, y);

        getPoints();

    } else {

        let page, reg, dithering = e.data.dithering, word = e.data.word;

        sort_method = 'ordered';
        ignorewhite = true;
        step = 3;
        // Проверяем слово на исключения
        if (!EXCEPTIONS.test(word)) word += ' cartoon';

        if (e.data.s_engine == 'Google') {

            //Google
            let resp = await fetch(`https://www.google.com/search?q=${word}&tbs=itp:clipart&tbm=isch`);
            page = await resp.text();
            reg = /base64,([\w+\\/]*)(?:\\x3d\\x3d'|\\x3d'|')/g;

        } else {

            //Yandex (поиск по клипартам)
            let resp = await fetch(`https://yandex.ru/images/search?text=${word}&type=clipart&nomisspell=1`);
            page = await resp.text();
            reg = /&quot;\/\/([\w\/\-\.\?=]+)&amp;n=13/g;

        }

        found = parsePage(page, reg);

        imgid = Math.random() * found.length | 0;

        if (e.data.s_engine == 'Google') {
            preurl = `data:image/png;base64,${found[imgid].replace(/\\/g, '')}`;
        } else {
            preurl = `https://${found[imgid]}&n=13`;
        }

        let resp = await fetch(preurl);
        let blob = await resp.blob();
        let img = await createImageBitmap(blob);

        iw = img.width, ih = img.height;
        imgres = [iw, ih];

        if (dithering) {

            let hRatio = bw / iw * .9;
            let vRatio = bh / ih * .9;
            let ratio = Math.min(hRatio, vRatio);
            let centerShift_x = (bw - iw * ratio) / 2;
            let centerShift_y = (bh - ih * ratio) / 2;

            ctxHidden.drawImage(img, 0, 0, iw, ih, centerShift_x, centerShift_y, iw * ratio, ih * ratio);
            let raw = ctxHidden.getImageData(0, 0, bw, bh);

            ditherImage(raw);

            let dither = await createImageBitmap(raw);

            ctxHidden.clearRect(0, 0, bw, bh);

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(dither, 0, 0, bw, bh, 0, 0, cw, ch);


        } else {

            let hRatio = cw / iw * .9;
            let vRatio = ch / ih * .9;
            let ratio = Math.min(hRatio, vRatio);
            let centerShift_x = (cw - iw * ratio) / 2;
            let centerShift_y = (ch - ih * ratio) / 2;

            ctx.drawImage(img, 0, 0, iw, ih, centerShift_x, centerShift_y, iw * ratio, ih * ratio);
        }

        getPoints();

    }
}



const getPoints = async () => {

    let points = [];

    let data = ctx.getImageData(0, 0, cw, ch).data;

    for (let i = 0; i < cw; i += step) {
        for (let j = 0; j < ch; j += step) {

            let index = (i + j * cw) * 4;

            if (data[index + 3] == 255) {

                let r = data[index];
                let g = data[index + 1];
                let b = data[index + 2];

                let current_color = nearestColor(r, g, b);

                // Находим одноцветные линии
                // !=n - цвет фоновой заливки, пропускаем
                if (ignorewhite ? current_color[1] != 0 : true) {

                    let last_y = j;

                    for (let k = j; k < ch; k += step) {

                        let index = (i + k * cw) * 4;

                        if (data[index + 3] == 255) {

                            let r = data[index];
                            let g = data[index + 1];
                            let b = data[index + 2];

                            let next_color = nearestColor(r, g, b);

                            if (next_color[1] == current_color[1]) {

                                last_y = k;

                            } else {
                                // закрываем линию - новый цвет
                                points.push([0, current_color[1], 4, i, j, i, last_y]);
                                j = k - step;
                                break;
                            }

                        } else {
                            // закрываем линию - прозрачный пиксель
                            points.push([0, current_color[1], 4, i, j, i, last_y]);
                            j = k - step;
                            break;
                        }
                    }
                }
            }
        }
    }

    ctx.clearRect(0, 0, cw, ch);

    let sorted = points;

    if (sort_method == "ordered") {
        sorted = points.sort((a, b) => a[1] - b[1])
    } else if (sort_method == 'rnd') {
        sorted = points.sort(() => .5 - Math.random());
    }

    postMessage({ dest: dest, points: sorted, found: found.length, imgid: imgid, preurl: preurl, imgres: imgres });
}



const nearestColor = (r, g, b) => {

    let closest, minDist = Infinity, index, dist;

    for (let i = 0; i < 26; i++) {

        let color = PALETTE[i];

        let rr = color.r, gg = color.g, bb = color.b;

        if (closest === undefined) {
            closest = color;
        }

        if (dithering) {

            let distr = Math.abs(rr - r);
            let distg = Math.abs(gg - g);
            let distb = Math.abs(bb - b);

            dist = (distr + distg + distb) / 3.5;

        } else {

            let distr = rr - r;
            let distg = gg - g;
            let distb = bb - b;

            dist = distr * distr + distg * distg + distb * distb;
        }

        if (dist < minDist) {
            closest = color;
            minDist = dist;
            index = i;
        }
    }

    return [closest, index];
}



const ditherImage = img => {

    let w = img.width,
        w4 = w * 4,
        h = img.height;

    for (let i = 0, l = w * h * 4; i < l; i += 4) {

        let x = (i % w),
            y = ~~(i / w),
            index = x + y * w,
            right = index + 4,
            bottomLeft = index - 4 + w4,
            bottom = index + w4,
            bottomRight = index + w4 + 4,
            pixel = img.data;

        let r = pixel[index], g = pixel[index + 1], b = pixel[index + 2];

        let color = nearestColor(r, g, b);

        let pr = color[0].r, pg = color[0].g, pb = color[0].b;

        // set new color
        pixel[index] = pr;
        pixel[index + 1] = pg;
        pixel[index + 2] = pb;

        // calculate error
        rErrorBase = (r - pr);
        gErrorBase = (g - pg);
        bErrorBase = (b - pb);

        // diffuse error right 7/16 = 0.4375
        pixel[right] += 0.4375 * rErrorBase;
        pixel[right + 1] += 0.4375 * gErrorBase;
        pixel[right + 2] += 0.4375 * bErrorBase;

        // diffuse error bottom-left 3/16 = 0.1875
        pixel[bottomLeft] += 0.1875 * rErrorBase;
        pixel[bottomLeft + 1] += 0.1875 * gErrorBase;
        pixel[bottomLeft + 2] += 0.1875 * bErrorBase;

        // diffuse error bottom 5/16 = 0.3125
        pixel[bottom] += 0.3125 * rErrorBase;
        pixel[bottom + 1] += 0.3125 * gErrorBase;
        pixel[bottom + 2] += 0.3125 * bErrorBase;

        //diffuse error bottom-right 1/16 = 0.0625
        pixel[bottomRight] += 0.0625 * rErrorBase;
        pixel[bottomRight + 1] += 0.0625 * gErrorBase;
        pixel[bottomRight + 2] += 0.0625 * bErrorBase;

    }
};
