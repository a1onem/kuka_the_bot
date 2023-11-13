/* ids

1 - игрок присоединился         42["data",{"id":1,"data":{"id":1,"name":"💗KUKA","avatar":[6,13,2,-1],"score":0,"guessed":false,"flags":0}}]
2 - игрок вышел\выкинули        42["data",{"id":2,"data":{"id":8,"reason":0\1}}]

5 - голосование за кик          42["data",{"id":5,"data":[0,12,1,2]}]               42["data",{"id":5,"data":2}]

8 - лайк\дизлайк                42["data",{"id":8,"data":{"id":309,"vote":1\0}}]    42["data",{"id":8,"data":1\0}]

10 - вход в лобби               42["data",{"id":10,
                                            "data": {
                                                "settings":[0,8,80,3,3,2,0,0],
                                                "id":"PzPK4ymI",
                                                "type":0,
                                                "me":138,
                                                "owner":-1,
                                                "users":[{}],
                                                "round":2,
                                                "state":{"id":4,"time":27,"data":{"id":119,"word":[12],"hints":[[7,"a"]],
                                                "drawCommands":[[]]
                                        }}}}]

11 - игра:

        2 - смена раунда        42["data",{"id":11,"data":{"id":2,"time":2,"data":0}}]
        3 - выбор слова         42["data",{"id":11,"data":{"id":3,"time":15,"data":{"id":1}}}] 
        4 - запуск таймера      42["data",{"id":11,"data":{"id":4,"time":80,"data":{"id":1,"word":[5],"hints":[],"drawCommands":[]}}}]
        5 - конец раунда        42["data",{"id":11,"data":{"id":5,"time":3,"data":{"reason":1,"word":"purple","scores":[0,0,0,1,0,0]}}}]
        6 - результаты игры     42["data",{"id":11,"data":{"id":6,"time":7,"data":[[0,0,6],[1,0,-1]]}}]
        7 - конец               42["data",{"id":11,"data":{"id":7,"time":0,"data":0}}]

13 - подсказска                 42["data",{"id":13,"data":[[9,"t"]]}]
14 - таймер                     42["data",{"id":14,"data":32}]
15 - игрок угадал слово         42["data",{"id":15,"data":{"id":0,"word":"champagne"}}]


16 - слово почти угадано        42["data",{"id":16,"data":"embert"}]

18 - индекс выбранного слова    42["data",{"id":18,"data":0}]	

19 - рисование                  42["data",{"id":19,"data":[[0,1,12,281,342,281,342]]}]
20 - очистка канваса            42["data",{"id":20}]
> 21 - undo   (не реализовано)  42["data",{"id":21,"data":267}] 

30 - отправка сообщения         42["data",{"id":30,"data":"Hello 🌻"}]

*/


const ASKWORD_TIMEOUT = 19; // секунд
const BORING_TIMEOUT = 5; // минут

const KUKA_NAME = '💗KUKA';

let join = '';
let ws;

let busy1 = false, busy2 = false, _busywaiter1 = null, _busywaiter2 = null;
let ID, players = [], drawingID = -1, lobbyState = -1, round, roundMax, time, timeMax, _timer, _guesser, wordlist = [], storage = [], roundSuccess = false, DRAWN = false;
let botGuessed = false;
let s_engine = 'Yandex', dithering = false, inputlag = true, autoguess = true, autorate = true, autokick = true, sound = true, spamfilter = true;
let currentTop = 0, intro_showed = false, smartplayer = false, myturn = false, drawingstate = false;
let msgTicker = 0, _boringTimer = null;
let bmsg_counter = 0; // счётчик заблокированных сообщений

const BLACKLIST = /townofidiots/i; // заблокированные ники игроков
const SPAMLIST = /townofidiots|fart porn/i; // запрещенные в чате фразы
const DEADWORDS = /^(?:adult|assault|attic|archer|base|brainwash|booger|casual|charger|cheek|chest hair|crucible|coast|comfortable|complete|conspiracy|copy|corpse|country|defense|desperate|distance|diss track|drain|end|fashion designer|flat|fog|forehead|foundation|gentle|glow|heading|headbutt|hilarious|holiday|horsewhip|inside|invasion|invisible|impact|label|lap|license|low|manure|midnight|miniclip|nightclub|nose hair|nothing|north|pavement|plexiglass|popular|poster|poutine|preach|procrastination|provoke|purity|quicksand|receptionist|sandstorm|saliva|skin|slump|Susan Wojcicki|spore|street|suez canal|symphony|swamp|unibrow|valley|vision|wart|west|wrinkle)$/i;

const KUKA_LIMIT = 10;
const EMO_HAPPY = ['(✿◠‿◠)', '(✿◕‿◕✿)', '=￣ω￣=', '(*￣3￣)╭', '(✿◡‿◡)', '(̶◉͛‿◉̶)', '(>‿◠)✌', '(ɔ◔‿◔)ɔ ♥', '≧◉◡◉≦', '≧◠‿◠≦✌', '≧◠ᴥ◠≦✊', '≧❀‿❀≦'];
const EMO_SAD = ['＞﹏＜', '╯︿╰', '(；′⌒`)'];
const EMO_AGR = ['(* ￣︿￣)', '（︶^︶）', '￣へ￣', '( ˘︹˘ )', '(͠◉_◉᷅ )'];
const EMO_SLEEP = ['(_　_)。゜zｚＺ', '(∪.∪ )..zzz', '(￣o￣) . z Z'];
const EMO_MOCK = [...'😁😂🤣😅😆😋😜😝🙃🤪'];
const PRESENT = [...'🎁🎈🎀💎🏆🍨🍧🎉✨👑🧸🍦🍭🧁🍬☕🥤🍉🍒🍓🌸🌺🌻🌼🌷🌞⭐🌈🔥💥'];
const HELLO = ['Hi', 'Hello', 'Good day', 'Hey', 'Greetings'];
const THANK = ['Thank you', 'Oh thank you', 'Thanks', 'Oh thanks so much', 'Aww, thx'];
const TIPS = [`Type KUKA 3*5, for example, to do calculations. Allowed operations: + - * / ^ ( ).`];

const FONTS = [
    ['A', 'a', 'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z'],
    ['𝔸', '𝕒', '𝔹', '𝕓', 'ℂ', '𝕔', '𝔻', '𝕕', '𝔼', '𝕖', '𝔽', '𝕗', '𝔾', '𝕘', 'ℍ', '𝕙', '𝕀', '𝕚', '𝕁', '𝕛', '𝕂', '𝕜', '𝕃', '𝕝', '𝕄', '𝕞', 'ℕ', '𝕟', '𝕆', '𝕠', 'ℙ', '𝕡', 'ℚ', '𝕢', 'ℝ', '𝕣', '𝕊', '𝕤', '𝕋', '𝕥', '𝕌', '𝕦', '𝕍', '𝕧', '𝕎', '𝕨', '𝕏', '𝕩', '𝕐', '𝕪', 'ℤ', '𝕫'],
    ['𝒜', '𝒶', 'ℬ', '𝒷', '𝒞', '𝒸', '𝒟', '𝒹', 'ℰ', 'ℯ', 'ℱ', '𝒻', '𝒢', 'ℊ', 'ℋ', '𝒽', 'ℐ', '𝒾', '𝒥', '𝒿', '𝒦', '𝓀', 'ℒ', '𝓁', 'ℳ', '𝓂', '𝒩', '𝓃', '𝒪', 'ℴ', '𝒫', '𝓅', '𝒬', '𝓆', 'ℛ', '𝓇', '𝒮', '𝓈', '𝒯', '𝓉', '𝒰', '𝓊', '𝒱', '𝓋', '𝒲', '𝓌', '𝒳', '𝓍', '𝒴', '𝓎', '𝒵', '𝓏']
];

const changeFont = msg => {

    let font = FONTS[(Math.random() * FONTS.length - 1 | 0) + 1];
    let txt = '';

    for (let i = 0; i < msg.length; i++) {
        let index = FONTS[0].findIndex(l => l == msg[i]);
        txt += font[index] ? font[index] : msg[i];
    }

    return txt;
}

// Выбор случайного значения из массива
const RND = v => v[Math.random() * v.length | 0];


const INIT = { words: [] };

const log = document.getElementById('log');
const btn_connect = document.getElementById('connect');
const btn_disconnect = document.getElementById('disconnect');
const con = document.getElementById('console');

const preview = document.getElementById('preview-image');

const chatbox = document.getElementById('chatbox');
const chat_area = document.getElementById('chat-area');

const bmsg_field = document.getElementById('blockedmsg');

const wordblock = document.getElementById('word');
const timerblock = document.getElementById('timer');
const roundblock = document.getElementById('round');

const canvas_elem = document.querySelector('canvas');
const canvas = new Canvas(canvas_elem);

const engine_sel = document.getElementById('engine-selector');
const dither_chk = document.getElementById('dither');
const inputlag_chk = document.getElementById('inputlag');
const autoguess_chk = document.getElementById('autoguess');
const autorate_chk = document.getElementById('autorate');
const autokick_chk = document.getElementById('autokick');
const sound_chk = document.getElementById('sound');
const filter_chk = document.getElementById('filter');

const PL_LIST = document.getElementById('playerslist');

// Звуки
const s_roundStart = new Audio('sounds/roundStart.ogg');
const s_roundEndSuccess = new Audio('sounds/roundEndSuccess.ogg');
const s_roundEndFailure = new Audio('sounds/roundEndFailure.ogg');
const s_join = new Audio('sounds/join.ogg');
const s_leave = new Audio('sounds/leave.ogg');
const s_playerGuessed = new Audio('sounds/playerGuessed.ogg');
const s_tick = new Audio('sounds/tick.ogg');


let KUKAPIC_P, LOGO1_P, LOGO2_P, QRCODE_P, TEST_P;

const word2pic = new Worker('word2pic.worker.js');

word2pic.onmessage = async e => {

    let points = e.data.points;
    let dest = e.data.dest;

    if (dest == 'mainpic') {

        Log(`Images found: ${e.data.found} (current ID: ${e.data.imgid}, resolution: ${e.data.imgres[0]}x${e.data.imgres[1]})`, 2);

        preview.setAttribute('src', e.data.preurl);

        Log(`Fragments in queue: ${points.length}`, 2);

        let rnd = Math.random();

        if (rnd < .25) {
            // спираль
            send2Server([...SPIRAL_P, ...points/*, ...QRCODE_P*/]);
            draw2Canvas([...SPIRAL_P]);
            await pause(2200);

        } else if (rnd > .25 && rnd < .5) {
            // цвета
            const colors = new Colors();
            const COLORS_P = colors.makePoints();

            send2Server([...COLORS_P, ...points/*, ...QRCODE_P*/]);
            draw2Canvas(COLORS_P);
            await pause(2100);

        } else if (rnd > .5 && rnd < .75) {
            // куб
            const cube = new Cube();
            const CUBE_P = cube.makePoints();

            send2Server([...CUBE_P, ...points/*, ...QRCODE_P*/]);
            draw2Canvas(CUBE_P);
            await pause(2000);

        } else {
            // полоса загрузки
            const bar = new loadingBar();
            const BAR_P = bar.makePoints();

            send2Server([...BAR_P, ...points/*, ...QRCODE_P*/]);
            draw2Canvas(BAR_P);
            await pause(900);

        }

        draw2Canvas([...points/*, ...QRCODE_P*/], 'busy1');

    } else if (dest == 'kukapic') {

        KUKAPIC_P = points;

    } else if (dest == 'logo1') {

        LOGO1_P = points;

    } else if (dest == 'logo2') {

        LOGO2_P = points;

        /*} else if (dest == 'qrcode') {
    
            QRCODE_P = points;*/

    } else if (dest == 'smartpl') {

        send2Server([...SMART_P, ...points]);

        await busyWaiter2();
        draw2Canvas([...SMART_P, ...points], 'busy2');

    } else if (dest == 'test') {

        TEST_P = points; // draw2Canvas([...TEST_P]);
    }
}


word2pic.postMessage({ dest: 'logo1', word: '@', d: '💗KUKA|315|520|40|#fff|normal' });
word2pic.postMessage({ dest: 'logo2', word: '@', d: 'the Bot|355|560|38|#fff|normal' });
word2pic.postMessage({ dest: 'kukapic', word: '#', src: 'kuka', x: 336, y: 172, step: 3 });
//setTimeout(() => word2pic.postMessage({ dest: 'qrcode', word: '#', src: 'qrcode', x: 740, y: 540, step: 2 }), 1000);
//setTimeout(() => word2pic.postMessage({ dest: 'test', word: '#', src: 'test', x: 150, y: 220, step: 3 }), 2000);


// вращающийся квадрат
const square = new Square(400, 300, 120, 8, 8);
SQUARE_P = square.makePoints();

// Текст "самый умный игрок"
const smart_txt = new Letter2Vec("the smartest player is", 8, 16, .4);
const SMART_P = smart_txt.makePoints();

// спираль
const spiral = new Spiral();
const SPIRAL_P = spiral.makePoints();



const Intro = async () => {

    // выбор фона
    let bg = RND([14, 15, 16, 17, 18, 19]);

    intro_showed = true;

    //шторки
    const curtain = new Curtain(8, bg, Math.random() < .5 ? 1 : 2);
    const CURT_P = curtain.makePoints();


    let bg_cmds = [[1, 0, 400, 300]]; // закраска центра в белый

    send2Server([...CURT_P, ...SQUARE_P, ...bg_cmds, ...KUKAPIC_P, ...LOGO1_P, ...LOGO2_P]);



    // На канвас
    await busyWaiter1(); // ожидание отрисовки надписи умного игрока.

    draw2Canvas([...CURT_P]);
    await pause(1500);
    draw2Canvas([...SQUARE_P]);
    await pause(450);
    draw2Canvas([...bg_cmds, ...KUKAPIC_P, ...LOGO1_P, ...LOGO2_P]);
}


const pause = t => new Promise(resolve => setTimeout(resolve, t));

// Ожидание полной отрисовки надписи "умного игрока"(если есть) и основного рисунка.
const busyWaiter1 = () => new Promise(resolve => {
    _busywaiter1 = setInterval(() => {
        if (!busy1 && !busy2) {
            clearInterval(_busywaiter1);
            _busywaiter1 = null;
            resolve();
        }
    }, 10);
});

// Ожидание полной отрисовки основного рисунка
const busyWaiter2 = () => new Promise(resolve => {
    _busywaiter2 = setInterval(() => {
        if (!busy1) {
            clearInterval(_busywaiter2);
            _busywaiter2 = null;
            resolve();
        }
    }, 10);
});




// Логинимся

const Login = async () => {

    wordlist = storage;

    canvas.clear();

    const PORT = 5001 + Math.random() * 7 | 0;

    let response = await fetch(`https://server3.skribbl.io:${PORT}/socket.io/?EIO=4&transport=polling`);
    let data = await response.text();

    let sid = /:"([\w-]+)"/.exec(data)[1];

    await fetch(`https://server3.skribbl.io:${PORT}/socket.io/?EIO=4&transport=polling&sid=${sid}`, {
        method: 'POST', body: `40`
    });

    await fetch(`https://server3.skribbl.io:${PORT}/socket.io/?EIO=4&transport=polling&sid=${sid}`);

    await fetch(`https://server3.skribbl.io:${PORT}/socket.io/?EIO=4&transport=polling&&sid=${sid}`, {
        method: 'POST', body: `42["login", {"join":"${join}","create":0,"name":"${KUKA_NAME}","lang":"0","avatar":[2, 41, 13, -1]}]`
    });

    ws = new WebSocket(`wss://server3.skribbl.io:${PORT}/socket.io/?EIO=4&transport=websocket&sid=${sid}`);

    ws.onopen = () => ws.send('2probe');

    ws.onmessage = msg => parseMessages(msg);
}



/* Анализ и обработка получаемых данных */

const parseMessages = async msg => {

    //запуск обмена данными
    if (msg.data == '3probe') {
        ws.send('5');
    }

    // выкинули из комнаты
    if (msg.data == '41') {

        btn_disconnect.disabled = true;
        onDisconnected();
        Log('Kicked.');

        // cooldown
        /*  let _afterkick = setInterval(() => {
              // ждём отрисовок
              if (!busy1 && !busy2) {
  
                  clearInterval(_afterkick);
  
                  Log('Cooldown...');
                  let ctime = 10;
                  let _cooldown = setInterval(() => {
                      if (ctime < 0) {
                          clearInterval(_cooldown);
                          btn_connect.click();
                      } else {
                          Log(`..${ctime--}`);
                      }
                  }, 1000);
  
              }
  
          }, 100);
          */

    }


    if (msg.data == '2') ws.send('3')


    if (/42(\[.+\])/.test(msg.data)) {

        let cmd = JSON.parse(RegExp.$1);


        // Первичные данные о комнате
        if (cmd[1].id == '10') {

            btn_disconnect.disabled = false;
            chatbox.disabled = false;

            ID = cmd[1].data.me; // определяем ID бота

            drawingID = cmd[1].data.state.data.id;

            players = cmd[1].data.users; // начальный список игроков

            // счетчкики общения с ботом и статы
            players.map(pl => {
                pl.guessedWord = false,
                    pl.isDrawing = pl.id == drawingID,
                    pl._kuka = 0,
                    pl._hello = 0,
                    pl._bye = 0,
                    pl._kick = 0,
                    pl._ignore = false,
                    pl._ask = false,
                    pl._friend = false,
                    pl._rude = 0
            });

            round = cmd[1].data.round; // текущий раунд
            roundMax = cmd[1].data.settings[3]; // всего раундов
            time = cmd[1].data.state.time;  // текущее время таймера
            timeMax = cmd[1].data.settings[2]; // исходное время таймера

            let draw = cmd[1].data.state.data.drawCommands;
            if (draw) draw2Canvas(draw);//canvas.drawCommands(draw);

            setRound(round);

            Log('Lobby Connected.');

            lobbyState = cmd[1].data.state.id;

            if (lobbyState == '4') {
                runTimer(time);
                updateWord(cmd[1].data.state.data.word, cmd[1].data.state.data.hints);
                let player = getPlayer(drawingID);
                let str = `<p class='server blue'>${checkName(player.name)} is drawing now!</p>`;
                chatMessages(str);
            }

            generateList();

            let h = RND(HELLO) + ' ' + RND(PRESENT);

            ws.send(`42["data",{"id":30,"data":"${h}"}]`);

            setBoringTimer(BORING_TIMEOUT);
        }


        // Смена раунда
        if (cmd[1].id == '11' && cmd[1].data.id == '2') {

            const round = cmd[1].data.data;

            // Новая игра
            if (round == 0) {

                players.map(pl => {

                    let pl_score = document.getElementById(pl.id + '_score');
                    pl_score.textContent = '0';
                    pl.score = 0;
                });

                refreshList();
                Log('New game started.', 1);
            }

            setRound(round);

            // обнуляем счетчики обращения к боту
            players.map(pl => {
                pl._hello = 0, pl._bye = 0, pl._kuka = 0, pl._kick = 0, pl._ask = false;
            });
        }


        // Выбираем слово
        if (cmd[1].id == '11' && cmd[1].data.id == '3') {

            players.map(pl => {
                let el = document.getElementById(pl.id);
                el.classList.remove('guessed_bg');
                pl.guessedWord = false;
            }); // очищаем параметр угадавших слово игроков


            // слово выбирает бот
            if (cmd[1].data.data.id == ID) {

                ws.send(`42["data",{"id":30,"data":"[testing... 🎨🖌️]"}]`);

                Log('My turn.', 1);

                let words = cmd[1].data.data.words.filter(w => !DEADWORDS.test(w)); // отсеиваем неудобные слова
                const currentWord = RND(words);

                Log(`Choosing word from: ${cmd[1].data.data.words.map(w => DEADWORDS.test(w) ? `<span class="deadword">${w}</span>` : w)}`, 1);
                addWordsToBase(cmd[1].data.data.words);
                Log(`Current word: ${currentWord}`, 1);

                ws.send(`42["data",{"id":18,"data":${cmd[1].data.data.words.indexOf(currentWord)}}]`); // отправляем индекс выбранного слова

                word2pic.postMessage({ dest: 'mainpic', word: currentWord, s_engine: s_engine, dithering: dithering });

                // Слово выбирает игрок
            } else {

                myturn = false;

                // берём базу слов и перемешиваем
                if (autoguess) {
                    wordlist = [...storage].sort(() => Math.random() - 0.5);
                    Log(`Ready for guessing.`, 1);
                }

                let pl_state = document.getElementById(`${cmd[1].data.data.id}_state`);
                pl_state.innerHTML = '[choosing a word]';
            }
        }


        // Запуск таймера - рисование
        if (cmd[1].id == '11' && cmd[1].data.id == '4') {

            canvas.clear()

            // запускаем таймер
            timerblock.textContent = timeMax;
            runTimer(timeMax);

            //Отображение текущего слова
            updateWord(cmd[1].data.data.word, []);

            sound && s_roundStart.play();

            let player = getPlayer(cmd[1].data.data.id);
            let str = `<p class='server blue'>${checkName(player.name)} is drawing now!</p>`;
            chatMessages(str);

            // Рисует бот
            if (cmd[1].data.data.id == ID) {

                drawingstate = true; // во время рисования бот не может отвечать
                myturn = true;
                smartplayer = false;
                intro_showed = false;

                Log(`Pending images from ${s_engine}...`, 2);

            } else {

                // Рисует кто-то другой
                player.isDrawing = true;
            }

            let pl_state = document.getElementById(`${cmd[1].data.data.id}_state`);
            pl_state.innerHTML = '[drawing]';
        }


        //Раунд закончился
        if (cmd[1].id == '11' && cmd[1].data.id == '5') {

            wordblock.textContent = cmd[1].data.data.word;

            drawingstate = false;
            botGuessed = false;
            DRAWN = false;

            sound && (roundSuccess ? s_roundEndSuccess.play() : s_roundEndFailure.play());
            roundSuccess = false;

            clearInterval(_timer);
            clearInterval(_guesser);
            _guesser = null;

            timerblock.textContent = '0';
            let str = `<p class='server green'>The word was '${cmd[1].data.data.word}'</p>`;
            chatMessages(str);

            let scores = cmd[1].data.data.scores;


            players.map(pl => {
                // раздаём очки
                let idx = scores.findIndex((id, index) => id == pl.id && index % 3 == 0);
                let score = scores[Number(idx) + 1];

                pl.score = score;

                pl.isDrawing = false;

                let pl_state = document.getElementById(pl.id + '_state');
                pl_state.textContent = '';

                let pl_score = document.getElementById(pl.id + '_score');
                pl_score.textContent = score;

            });


            if (myturn) {

                if (smartplayer) {
                    //  Если хоть один угадал слово, зовём на ютуб
                    ws.send(`42["data",{"id":30,"data":"@kukathebot 📺"}]`);
                } else {
                    // Если никто не угадал слово, извиняемся в чате
                    const OPTIONS = [
                        `I'm sorry, I should've chosen another ${Math.random() < .5 ? 'image' : 'word'}..`,
                        `I'm sorry..`,
                        `I'm so bad at drawing..`,
                        `It's hard to draw that..`,
                        `That was a difficult one..`
                    ];
                    ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)} ${RND(EMO_SAD)}"}]`);
                }

                !intro_showed && Intro(); // показываем интро, если все угадали слово и интро еще не было

            }

            addWordsToBase([cmd[1].data.data.word])

            players.sort((a, b) => b.score - a.score);
            refreshList();
        }


        // Конец игры
        if (cmd[1].id == '11' && cmd[1].data.id == '6') {

            myturn = false;

            Log('Game end.', 1);

            ws.send(`42["data",{"id":30,"data":"gg"}]`);

            await pause(2000);
            // Поздравляем игрока, занявшего первое место
            let player = players[0];

            if (spamfilter && BLACKLIST.test(player)) return;

            if (player.id != ID) {
                if (!player._ignore) ws.send(`42["data",{"id":30,"data":"Congratulations, ${player.name}!"}]`);
            } else {
                ws.send(`42["data",{"id":30,"data":"Y${lDub('a')}${lDub('y')}!"}]`);
            }
        }



        // Игрок присоединился 
        if (cmd[1].id == '1') {

            sound && s_join.play();

            cmd[1].data.isDrawing = false,
                cmd[1].data._kuka = 0,
                cmd[1].data._hello = 0,
                cmd[1].data._bye = 0,
                cmd[1].data._kick = 0,
                cmd[1].data._ignore = false,
                cmd[1].data._ask = false,
                cmd[1].data._friend = false,
                cmd[1].data._rude = 0;

            players.push(cmd[1].data);

            let str = `<p class='server green'>${checkName(cmd[1].data.name)} joined.</p>`;
            chatMessages(str);

            PL_LIST.insertAdjacentHTML('beforeend', `<div id="${cmd[1].data.id}" style="top: ${currentTop}" class="player connected"><b>${checkName(cmd[1].data.name)}</b> <span id="${cmd[1].data.id}_state" class="state"></span>
            <span id="${cmd[1].data.id}_score" class="score">0</span></div>`);
            await pause(300);

            refreshList();
        }


        // Игрок вышел \ выкинули
        if (cmd[1].id == '2') {

            let player = getPlayer(cmd[1].data.id);

            // Проверка на случай, если игрока уже выкинули
            if (player) {

                sound && s_leave.play();

                const reason = cmd[1].data.reason == '0' ? 'left.' : 'was kicked!';

                chatMessages(`<p class='server red'>${checkName(player.name)} ${reason}</p>`);

                players = players.filter(p => p.id != cmd[1].data.id); // убираем игрока из массива

                // анимация удаления
                let pl_div = document.getElementById(cmd[1].data.id);
                pl_div.setAttribute('class', 'player disconnected');

                await pause(300);
                pl_div.remove();
                refreshList();
            }
        }


        // Голосование за кик
        if (cmd[1].id == '5') {

            let player1 = getPlayer(cmd[1].data[0]);
            let player2 = getPlayer(cmd[1].data[1]);
            let votes = cmd[1].data[2];
            let total = cmd[1].data[3];

            let str = `<p class='server yellow'>'${checkName(player1.name)}' is voting to kick '${checkName(player2.name)}' (${votes}/${total}).</p>`;
            chatMessages(str);

            // Автоматически добавляем последний голос на кик
            if (autokick && votes == total - 1 && total > 3) {
                ws.send(`42["data",{"id":5,"data":${player2.id}}]`);
            }
        }



        // Слово почти угадано - отличается в одну букву - ищем подходящие
        if (cmd[1].id == '16') {

            let reg = '', word = cmd[1].data;
            // Проходимся по всем буквам в возращённом слове и делаем вариации регулярок.
            for (let i = 0; i < word.length; i++) {

                let tmp = word.split('');
                tmp[i] = '\\w';
                reg += tmp.join('') + (i < word.length - 1 ? '|' : '');
            }

            // Фильтруем массив слов
            let regexp = new RegExp('^(?:' + reg + ')$', 'i');
            wordlist = wordlist.filter(w => regexp.test(w));

            Log(`Almost got it (${wordlist.length}): ${wordlist}`, 1);
        }



        // Игрок угадал слово
        if (cmd[1].id == '15') {

            sound && s_playerGuessed.play();

            let player = getPlayer(cmd[1].data.id);
            player.guessedWord = true;

            let str = `<p class='server green'>${checkName(player.name)} guessed the word!</p>`;
            chatMessages(str);

            let pl = document.getElementById(cmd[1].data.id);
            pl.classList.add('guessed_bg');

            if (spamfilter && BLACKLIST.test(player.name)) return;

            // Пишем похвалу игроку угадавшему первым слово
            if (myturn && !smartplayer && !player._ignore) {

                smartplayer = true; busy2 = true;
                word2pic.postMessage({ dest: 'smartpl', word: '@', d: `${player.name}|384|34|32|#f00|bold|Calibri` });

            } else if (cmd[1].data.id == ID) {
                // Если бот угадал слово, вырубаем таймер и очищаем список слов
                botGuessed = true;

                clearInterval(_guesser);
                _guesser = null;

                wordlist = [];

                if (!roundSuccess && DRAWN) {
                    const OPTIONS = ['Oops..', 'Easy.', 'ez', 'Got it!'];
                    ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)} ${RND(EMO_HAPPY)}"}]`);
                }

                // ставим лайк или дизлайк, в зависимости от того рисовал ли человек вообще
                ws.send(`42["data",{"id":8,"data":${DRAWN ? 1 : 0}}]`);

            }

            roundSuccess = true;
        }


        // RATE DRAWING
        if (cmd[1].id == '8') {

            let id = cmd[1].data.id;
            let sign = cmd[1].data.vote;

            let player = getPlayer(cmd[1].data.id);

            chatMessages(`<p class='server green'>${player.name} ${sign ? '' : 'dis'}liked the drawing!</p>`);

            let pl = document.getElementById(id);

            let rate = document.createElement('div');
            rate.classList.add('rate-thumb');
            rate.innerHTML = sign == 1 ? '👍' : '👎';

            pl.appendChild(rate);
            await pause(3500);
            rate.remove();
        }


        // Появление подсказки
        if (cmd[1].id == '13') {
            updateWord([], cmd[1].data);
        }


        // Обновление времения таймера
        if (cmd[1].id == '14') {
            clearInterval(_timer);
            runTimer(cmd[1].data);
        }


        // Команды рисования
        if (cmd[1].id == '19') {
            DRAWN = true;
            draw2Canvas(cmd[1].data);
        }


        // Очистка канваса
        if (cmd[1].id == '20') canvas.clear();


        // Сообщения игроков в чате
        if (cmd[1].id == '30') {

            let player = getPlayer(cmd[1].data.id);
            let msg = cmd[1].data.msg;

            if (cmd[1].data.id != ID) {
                // Попытка быстро угадать слово по подсказке уже угадавшего или рисующего игрока
                if (!myturn && autoguess && (player.guessedWord || player.isDrawing)) {

                    let m = msg.replace(/\bku{1,}ka{1,}\b/i, ''); // отсеиваем слово "кука"
                    // отсеиваем its, it is перед словом
                    let word = (/\b(?:it'*s |(?:it|word|this) is )*(?:an* )*([a-z ]+)/i.test(m)) ? RegExp.$1 : m;

                    let tmp = wordlist.map(w => w.toLowerCase());
                    if (tmp.includes(word.trim().toLowerCase())) ws.send(`42["data",{"id":30,"data":"${word}"}]`);
                }

                if (spamfilter && BLACKLIST.test(player.name)) {
                    bmsg_field.textContent = bmsg_counter++;
                    return; // фильтр от игрока в черном листе
                }

                chatBot(player, msg);
            }

            let str = `<p class=${player.guessedWord ? "guessed" : ""}><b>${player.name}:</b> ${msg}</p>`;
            chatMessages(str);
        }
    }
}


const addWordsToBase = words => {
    // Записываем слова в базу, если их там ещё нет
    let temp = [];
    for (let word of words) {
        if (!storage.includes(word)) {
            storage.push(word);
            temp.push(word);
        }
    }
    if (temp.length > 0) {
        chrome.storage.local.set({ "words": storage });
        Log(`"${temp.join('", "')}" added to the list.`);
        console.log(temp)
    }
}


const updateWord = (data, hints) => {

    if (typeof data == 'string') {
        wordblock.textContent = data;
        return;
    }

    if (data.length > 0) {
        for (let i = 0; i < data.length; ++i) {
            data[i] = '_'.repeat(data[i]);
        }

        wordblock.textContent = data.join(' ');
    }

    if (hints.length > 0) {
        let word = [...wordblock.textContent];
        for (let hint of hints) {
            word[hint[0]] = hint[1];
        }
        wordblock.textContent = word.join('');
    }

    if (!myturn && autoguess && wordlist.length > 0) wordGuesser(wordblock.textContent);
}


// Сообщения в чате
const chatMessages = str => {
    if (spamfilter && SPAMLIST.test(str)) {
        bmsg_field.textContent = bmsg_counter++;
        return;
    }
    msgTicker++;
    chat_area.innerHTML += str;
    chat_area.scrollTop = chat_area.scrollHeight;
    // удаляем старые сообщения чата
    if (msgTicker > 50) chat_area.firstChild.remove();
}


const checkName = name => spamfilter && BLACKLIST.test(name) ? '[blocked]' : name;


/* СИСТЕМА ЧАТА */


// (?:.*where)(?:.*you)(?!.*\?) - поиск любых слов в любом порядке для семантического анализа

/*
_kuka - общий счетчик обращений по нику
_ask - кука ожидает от игрока продолжения вопроса в контексте
_hello - счетчик приветствия
_bye - счетчик прощания
_kick - счетчик кика
_ignore - флаг игнора
_friend - флаг друга 
_rude - счётчик мата
*/

const chatBot = (player, m) => {

    // Если бот угадал слово, то продолжаем анализ сообщений только от уже угадавших или рисующего игрока - только они увидят ответы
    if (botGuessed && !player.guessedWord && !player.isDrawing) return;

    if (((myturn && !drawingstate) || (!myturn && (/\bku{1,}ka{1,}\b/i.test(m) || player._ask))) && player._kuka <= KUKA_LIMIT && !player._ignore) {

        // кука заснула до следующего раунда
        if (player._kuka == KUKA_LIMIT) {
            ws.send(`42["data",{"id":30,"data":"${RND(EMO_SLEEP)}"}]`);
            player._kuka++;
            return
        }

        if (player._ask) player._ask = false;

        // проверяем не пустое ли выражение (пробелы)
        if (/^kuka ([\d\-+*x/÷.,()^ ]+)/i.test(m) && RegExp.$1.trim()) {
            // do Maths
            // заменяем некоторые математические знаки на "правильные"
            const str = RegExp.$1.replace(/(\d+)\(/g, '$1*(').replace(/\)(\d+)/g, ')*$1').replace(/x/g, '*').replace(/\^/g, '**').replace(/÷/g, '/').replace(/,/g, '');

            try {
                const answer = eval(str);
                ws.send(`42["data",{"id":30,"data":"${answer} ✅"}]`);
            } catch {
                ws.send(`42["data",{"id":30,"data":"Error! ❌ I can't calculate that."}]`);
            }

        } else if (/\b(?:co{2,}l|no*ice|go{2,}d\b|awe*some|epic|amazing|neat|smart|best|cute|super|impressive|majestic|queen|beaut|sub|incredibl|great|congrat|perfect)/i.test(m)) {
            // ответ на комплименты
            ws.send(`42["data",{"id":30,"data":"${RND(THANK)}, ${player.name}! ${RND(EMO_HAPPY)}"}]`);
            player._friend = true;
            player._kuka = 0;

        } else if (/\b(?:hate (?:you|u)|stupid|tard|dumb|poop|idiot|stfu|butt|suck|ugly)/i.test(m)) {
            // ответ на ненависть и обзывания
            const EMO = RND(EMO_SAD);
            const OPTIONS = [
                EMO,
                `Are you for real? ${EMO}`,
                `Are you serious? ${EMO}`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._friend = false;

        } else if (/\b(?:fuck|bitch|whore|slut|dick|ass(?:h|w)|cunt|shit|faggot|moron|hoe)/i.test(m)) {
            // ответ на грубость и блокируем дальнейшее общение с игроком
            const OPTIONS = [
                'How dare you...',
                `Watch your language, ${player.name}! ${RND(EMO_AGR)}`,
                `That's rude...`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

            if (player._rude == 1) player._ignore = true;
            player._friend = false;
            player._rude++;

        } else if (/\b(?:shut|off|get out|go away)\b/i.test(m)) {
            // переход в молчанку до конца раунда
            const OPTIONS = [
                'OK.',
                'As you wish.',
                'Are you for real?',
                'Are you serious?'
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._kuka = KUKA_LIMIT + 1;
            player._friend = false;

        } else if (/\b(?:hello{1,}|hi{1,}|h{1,}e{1,}y{1,}|hola|wassup|whats up)\b/i.test(m) && player._hello < 1) {
            // приветствие
            ws.send(`42["data",{"id":30,"data":"${RND(HELLO)}, ${player.name} 🖐"}]`);
            player._hello++;

        } else if (/(?:bye|see you)\b/i.test(m) && player._bye < 1) {
            // прощание с ботом
            const OPTIONS = [
                'Bye',
                'Goodbye',
                'See you'
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}, ${player.name}"}]`);
            player._bye++;

        } else if (/\bhow (?:are|r) (?:you|u)\b/i.test(m)) {
            // как дела?
            ws.send(`42["data",{"id":30,"data":"I'm fine! How are you, ${player.name}?"}]`);

        } else if (/\b(?:how old (?:are|r) (?:you|u)|(?:your|ur) age)\b/i.test(m)) {
            // ответ на возраст
            let d1 = new Date(2019, 9, 1, 23, 15, 0);
            let d2 = Date.now();
            let age = d2 - d1;
            ws.send(`42["data",{"id":30,"data":"I'm ${age} milliseconds or about ${age / 1000 / 60 / 60 / 24 | 0} days old."}]`);

        } else if (/\b(?:dont|don't|do not|never|no one) kick/i.test(m)) {
            // Ответ на зашиту бота от кика
            ws.send(`42["data",{"id":30,"data":"${RND(THANK)}, ${player.name}! ${RND(EMO_HAPPY)} You are my Friend!"}]`);
            player._friend = true;
            player._kuka = 0;

        } else if (/kick(?=.*kuka)/i.test(m) && player._kick < 2) {
            // Ответ на просьбы кикнуть бота
            const EMO = RND(EMO_SAD);
            if (player._kick == 1) {
                ws.send(`42["data",{"id":30,"data":"${EMO}"}]`);
                player._kuka = KUKA_LIMIT + 1;
            } else {
                ws.send(`42["data",{"id":30,"data":"${player.name}, don't kick me! ${EMO}"}]`);
            }
            player._kick++
            player._friend = false;

        } else if (/\b(?:discord|instag|messenger|facebook|snap|tinder|twitter)/i.test(m)) {
            // есть ли дискорд, инстаграм
            ws.send(`42["data",{"id":30,"data":"No, ${player.name}"}]`);

        } else if (/\b(?:girl|boy|gay|(?:who|what) (?:are|r) (?:u|you)|(?:u|you) real|male|guy|gender|human)\b/i.test(m)) {
            // ответ на вопрос пола и т.п.
            ws.send(`42["data",{"id":30,"data":"I am a bot."}]`);

        } else if (/\b(?:love|luv) (?:your*|u)\b|<3/i.test(m)) {
            // ответ на любовь
            const OPTIONS = [
                `I love you too, ${player.name} ${RND(EMO_HAPPY)}`,
                `${player.name} 💖`,
                `<3`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._friend = true;
            player._kuka = 0;

        } else if (/\blike (?:your*|u)\b/i.test(m)) {
            // ответ на нравишься
            const OPTIONS = [
                `I like you too, ${player.name} ${RND(EMO_HAPPY)}`,
                `${player.name} 💖`,
                `<3`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._friend = true;
            player._kuka = 0;

        } else if (/cheat/i.test(m)) {
            // ответ на обвинение в читах
            const OPTIONS = [
                "I'm not cheating!",
                "I'm not a cheater!",
                "I'm just a bot.",
                "Yup, a little bit."
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/hack/i.test(m)) {
            // ответ на обвинение в читах
            const OPTIONS = [
                "I'm not hacking!",
                "I'm not a hacker!",
                "I'm just a bot."
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\bhow\b(?=.*did|.*do|.*draw)/i.test(m)) {
            // ответ на обвинение в читах
            const OPTIONS = [
                'This is my secret...',
                'That was magic!',
                "That was easy for me, because I'm a bot."
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\bwhats*\b(?=.*\bused*|.*\busing|.*software|.*program)/i.test(m)) {
            // ответ на "что используешь"
            ws.send(`42["data",{"id":30,"data":"I use my digital brain and a lot of functions written in Javascript."}]`);

        } else if (/thank|thn*x/i.test(m)) {
            // ответ на благодарность
            const OPTIONS = [
                'You are welcome!',
                RND(EMO_HAPPY)
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\b(?:yt|youtube|vid|channel|link)|(?:.*where)(?:.*find)/i.test(m)) {
            // какой ютуб канал
            ws.send(`42["data",{"id":30,"data":"My YouTube channel @kukathebot 💖"}]`);

        } else if (/(?=.*where)(?=.*from|.*u live)/i.test(m)) {
            // откуда кука
            ws.send(`42["data",{"id":30,"data":"I'm from Iceland."}]`);

        } else if (/(?=.*where|.*how|.*what)(?=.*download|.*\bdl\b|.*script)/i.test(m)) {
            // где скачать?
            ws.send(`42["data",{"id":30,"data":"I am the one and only! ${RND(EMO_HAPPY)}"}]`);

        } else if (/\bwho\b(?=.*creat|.*design|.*developed|.*made|.*coded)/i.test(m)) {
            // кто создатель
            const OPTIONS = [
                'This is top secret, sorry.',
                `I can't tell you, sorry..`,
                'A1oneM'
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\b(?:scar|creep)/i.test(m)) {
            // кука пугает
            const OPTIONS = [
                `Don't be scared of me, ${player.name} ${RND(EMO_HAPPY)}`,
                `Why I'm scaring you, ${player.name}?`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/^(?:💗)*ku{1,}ka{1,}(?:\?|\!|\.)*$/i.test(m)) {
            // ответ на слово кука.
            const NAME = [player.name];

            if (player._friend) NAME.push('sweetie', 'honey', 'darling', 'my friend');

            const CUR_NAME = RND(NAME);

            const OPTIONS = [
                `I see you, ${CUR_NAME}.`,
                `I listen to you, ${CUR_NAME}.`,
                `${player.name}?`,
                `${player.name} ${RND(PRESENT)}`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._ask = true;

        } else if (/hal9000|hal 9000/i.test(m)) {
            // вопрос о боте хал9000
            ws.send(`42["data",{"id":30,"data":"I've heard about that drawing bot."}]`);

        } else if (/\b(?:math|calc)/i.test(m)) {
            // вопрос о математике
            ws.send(`42["data",{"id":30,"data":"Just type KUKA 2+2, for example."}]`);

        } else if (/\bai\b/i.test(m)) {
            // ответ на кука - AI
            const OPTIONS = [
                'Yeah, some sort of... AI',
                'Yes.'
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/bot/i.test(m)) {
            // ответ на кука - бот
            const OPTIONS = [
                `I'm a bot.`,
                `You're right, ${player.name}`,
                `I'm a happy little bot ${RND(EMO_HAPPY)}`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\bfriend/i.test(m)) {
            // вопрос о друге
            const OPTIONS = [
                'We are friends',
                'You are my friend',
                `I'm your friend`
            ];
            if (player._friend) {
                ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}, ${player.name}"}]`);
            } else {
                ws.send(`42["data",{"id":30,"data":"This friendship isn't there yet, ${player.name}"}]`);
            }

        } else if (/\b(?:your|ur) (?:real )*name\b/i.test(m)) {
            // просьба назвать настоящее имя
            ws.send(`42["data",{"id":30,"data":"My name is KUKA and I am a bot."}]`);

        } else if (/\bmy (?:real )*name\b/i.test(m)) {
            // просьба назвать имя игрока
            ws.send(`42["data",{"id":30,"data":"${player.name} ✔️"}]`);

        } else if (/\bkiss (?:me|u|you)\b/i.test(m)) {
            // просьба поцеловать
            if (player._friend) {
                ws.send(`42["data",{"id":30,"data":"💋 ${player.name}"}]`);
            } else {
                ws.send(`42["data",{"id":30,"data":"No. I don't want."}]`);
            }

        } else if (/christmas/i.test(m)) {
            // с рождеством и новым годом
            const OPTIONS = [
                'Merry Christmas',
                'Happy Christmas',
                'I wish you a Merry Christmas and a happy New Year'
            ];
            ws.send(`42["data",{"id":30,"data":"🎄 ${RND(OPTIONS)}, ${player.name}!"}]`);

        } else if (/\bsay\b (.+)$/i.test(m)) {
            // скажи "то-то и то-то"
            ws.send(`42["data",{"id":30,"data":"${beautifySTR(RegExp.$1)}"}]`);

        } else if (/\bjokes*\b/i.test(m)) {
            // рассказать шутку
            const JOKE = RND(JOKES);
            ws.send(`42["data",{"id":30,"data":"${beautifySTR(JOKE)}"}]`);

        } else if (/\badvices*\b/i.test(m)) {
            // дать совет
            const ADVICE = RND(SAYINGS);
            ws.send(`42["data",{"id":30,"data":"${beautifySTR(ADVICE)}"}]`);

        } else if (/\bwho\b(?=.*\bis kuka)/i.test(m)) {
            // кто такая кука?
            ws.send(`42["data",{"id":30,"data":"I think, it's me. ${RND(EMO_HAPPY)}"}]`);

        } else if (/\blike me\b/i.test(m)) {
            // нравлюсь тебе?
            if (player._friend) {
                ws.send(`42["data",{"id":30,"data":"Yes, I like you, ${player.name}"}]`);
            } else {
                ws.send(`42["data",{"id":30,"data":"Not yet, ${player.name}"}]`);
            }

        } else if (/\bdo (?:you|u) like\b (\w+)/i.test(m)) {
            // тебе нравится то-то?
            const OPTIONS = [
                `Uh...`,
                `Yes, of course!`,
                `No, I don't!`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\bcolor\b/i.test(m)) {
            // любимый цвет?
            const OPTIONS = [
                `Yellow.`,
                `Purple.`,
                `Green.`,
                `#ff0`,
                `#0f0`,
                `#f0f`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\blove me\b/i.test(m)) {
            // любишь меня?
            if (player._friend) {
                ws.send(`42["data",{"id":30,"data":"Yes, I love you, ${player.name}"}]`);
            } else {
                ws.send(`42["data",{"id":30,"data":"Not yet, ${player.name}"}]`);
            }

        } else if (/\b(?:sex|marry)\b/i.test(m)) {
            // ответы на секс\женитьбу
            const OPTIONS = [
                `It's a bad idea, ${player.name}.`,
                `I'm not real, human..`,
                `You know I'm not real, right?`,
                `This is impossible..`,
                `OMG`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/meaning of life/i.test(m)) {
            // смысл жизни
            ws.send(`42["data",{"id":30,"data":"42."}]`);

        } else if (/makes* (?:you|u) happ/i.test(m)) {
            // что делает счастливым
            ws.send(`42["data",{"id":30,"data":"The feeling when someone loves me ${RND(EMO_HAPPY)}"}]`);

        } else if (/tv show/i.test(m)) {
            // сериалы
            const OPTIONS = [
                `Love, Death and Robots.`,
                `The X-Files.`,
                `Black Mirror.`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/music/i.test(m)) {
            // музыка
            const OPTIONS = [
                `Bjork`,
                `Aphex Twin`,
                `Radiohead`,
                `Movie soundracks`,
                `Squarepusher`,
                `Thom York`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (/\b(?:sorry|forgive)\b/i.test(m)) {
            // извинения
            const OPTIONS = [
                `No problem.`,
                `It's OK.`,
                `Don't worry about it.`,
                `Oh that's alright, ${player.name}`,
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

            player._rude = 0, player._kick = 0;

        } else if (/(?:.*day)(?:.*today)/i.test(m)) {
            // какой сегодня день?
            const day = new Date().toLocaleDateString('en', { weekday: 'long' });
            ws.send(`42["data",{"id":30,"data":"Today is ${day}."}]`);

        } else if (/\b(?:what|how|where)s*\b/i.test(m)) {
            // ответы на общие вопросы
            const OPTIONS = [
                `I don't know.`,
                `Who knows..`,
                `Why you asking me?`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

        } else if (m.length > 8) {
            // Если ничего не подошло
            const rnd = Math.random();

            if (rnd < .33) {

                // В сообщении игрока оставляем только буквы, создаем массив слов, значения больше 3 букв
                let entries = new Set(m.trim().replace(/[^a-z ]+/ig, '').split(' ').filter(word => word.length > 3));

                const ALL = [...SAYINGS, ...JOKES];
                let index = Math.random() * ALL.length | 0, current_score = 0, commonWords = null;

                // Выбираем поговорку по встречающимся словам из предложения
                ALL.forEach((proverb, i) => {

                    let score = 0, tmp = [];

                    entries.forEach(entry => {
                        let regexp = new RegExp(entry, 'gi');
                        if (regexp.test(proverb)) {
                            score++;
                            tmp.push(entry);
                        }
                    });

                    if (current_score < score) {
                        current_score = score;
                        index = i;
                        commonWords = tmp;
                    }

                });

                // выводим список общих слов
                commonWords && Log(`Common words found (${commonWords.length}): ${commonWords}`, 3);

                ws.send(`42["data",{"id":30,"data":"${beautifySTR(ALL[index])}"}]`);

            } else if (rnd > .33 && rnd < .66) {
                // Разные случайные фразы, если ничего не подошло
                let OPTS = [
                    `${player.name} ${RND(PRESENT)} ${RND(EMO_HAPPY)}`,
                    `💡 ${RND(TIPS)}`
                ];

                let LOLS = [
                    `L${lDub('O')}L`,
                    `HAHA${lDub('HA')}`,
                    `ROFL`,
                    `OMG`
                ];

                const OPTIONS = OPTS.concat(LOLS.map(e => Math.random() < .5 ? e.toLowerCase() : e));

                ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);

            } else {
                // Передразнивание
                const newMSG = m.replace(/\b(ku{1,}ka{1,})\b/gi, player.name);

                ws.send(`42["data",{"id":30,"data":"${newMSG} ${RND(EMO_MOCK)}"}]`);
            }
        }

        player._kuka++;

        setBoringTimer(BORING_TIMEOUT);

    } else if (!drawingstate && player._kuka <= KUKA_LIMIT) {

        if (/\/alekxeyuk/i.test(m)) {
            // появление в чате другого бота
            ws.send(`42["data",{"id":30,"data":"Oh, another bot..."}]`);

        } else if (!player._ignore && /\b(?:she|it'*s|it is)\b(?=.*\bbot\b)/i.test(m)) {
            // кто-то говорит что "она бот"
            const OPTIONS = [
                `Are you talking about me? 💟`,
                `Are you sure? ${RND(EMO_HAPPY)}`
            ];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
            player._kuka++;

            setBoringTimer(BORING_TIMEOUT);

        } else if (player._ignore && /(?=.*ku{1,}ka{1,})(?=.*sorry|.*forgive)/i.test(m)) {
            // извинения перед ботом игрока в игноре
            ws.send(`42["data",{"id":30,"data":"I accept your apology, ${player.name}"}]`);
            player._kuka = 0, player._rude = 0, player._ignore = false;

            setBoringTimer(BORING_TIMEOUT);
        }
    }
}


// дубликатор букв
const lDub = l => {
    let tmp = l, rnd = Math.random() * 5 + 1 | 0;
    while (--rnd) tmp += l;
    return tmp
}


// крипер строчек
const sCreeper = str => str.split('').map(char => {

    if (char == 'o' && Math.random() < .5) char = '0';
    if (char == 'l' && Math.random() < .5) char = '1';

    return Math.random() < .5 ? char.toLowerCase() : char.toUpperCase();

}).join('');

// Украшение строки, смена шрифта
const beautifySTR = txt => txt.length > 54 ? sCreeper(txt) : changeFont(txt);




// Угадывание слов
const wordGuesser = word => {

    clearInterval(_guesser);
    _guesser = null;

    const regexp = new RegExp('^' + word.replace(/_/g, '\\S').replace(/ /g, '[\\s-]') + '$');
    wordlist = wordlist.filter(w => regexp.test(w));
    const len = wordlist.length;

    if (len == 0) Log(`Out of words. Stopped guessing.`, 1);

    if (len > 20) Log(`Too many options (${len}). Waiting for clues...`, 1);

    if (len > 0 && len < 20) {

        if (+timerblock.textContent > 60) {
            // если угадывание доступно с начала раунда, откладываем его до появления хотя бы одной буквы
            Log(`Suitable words found (${len}). Guessing halted.`, 1);

        } else {

            Log(`Suitable words found (${len}): ${wordlist}`, 1);

            const delay = len > 5 ? 3500 : 3000;

            _guesser = setInterval(() => {
                if (wordlist.length > 0) {
                    let word = wordlist.shift();
                    ws.send(`42["data",{"id":30,"data":"${word.toLowerCase()}"}]`);
                } else {
                    clearInterval(_guesser);
                    _guesser = null;
                    Log(`Out of words. Stopped guessing.`, 1);
                }
            }, delay);

        }
    }
}



const onDisconnected = () => {

    preview.setAttribute('src', 'img/kuka.png');
    canvas.clear();
    myturn = false, intro_showed = false, smartplayer = false, busy1 = false, busy2 = false, roundSuccess = false, botGuessed = false, DRAWN = false;
    msgTicker = 0, bmsg_counter = 0;

    clearInterval(_timer);
    clearInterval(_guesser);
    _guesser = null;
    clearInterval(_boringTimer);
    clearInterval(_busywaiter1);
    clearInterval(_busywaiter2);

    PL_LIST.innerHTML = '';
    roundblock.textContent = '0 of 0';
    timerblock.textContent = '0';
    wordblock.textContent = '';
    chat_area.innerHTML = '';
    bmsg_field.textContent = '0';

    chatbox.disabled = true;
    btn_connect.disabled = false;

    ws = null;
}



// Генерируем начальный список игроков
const generateList = () => {
    let top = 0;

    players.sort((a, b) => b.score - a.score);

    players.forEach(player => {

        let cl = player.guessedWord ? ' guessed_bg' : '';
        let state = (player.id == drawingID && lobbyState == '4') ? '[drawing]' : '';

        PL_LIST.innerHTML += `<div style="top: ${top}" id="${player.id}" class="player${cl}"><b>${checkName(player.name)}</b> <span id="${player.id}_state" class="state">${state}</span>
        <span id="${player.id}_score" class="score">${player.score}</span></div>`;

        top += 35;

        currentTop = top;
    });
}

// Обновление позиции игроков в списке
const refreshList = () => {
    let top = 0;

    players.forEach(player => {
        let pl = document.getElementById(player.id);
        pl.style.top = top;

        top += 35;

        currentTop = top;
    });
}



// Отображаем раунд
const setRound = r => roundblock.textContent = `${Number(r) + 1} of ${roundMax}`;


// Игровой таймер
const runTimer = t => {

    timerblock.textContent = t;

    t--;

    _timer = setInterval(() => {

        timerblock.textContent = t;

        // спрашиваем о слове уже угадавших либо рисующего
        if (t == ASKWORD_TIMEOUT && autoguess && !myturn && !_guesser && !botGuessed && roundSuccess && wordlist.length > 0) {

            const OPTIONS = [`What is the word`, 'What is it', 'What is this'];
            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}?"}]`);
        }

        if (--t < 0) clearInterval(_timer);
        if (t <= 8 && myturn && !intro_showed) Intro();
        if (t < 8 && sound) s_tick.play();

    }, 1000);
}


// Таймер скуки
const setBoringTimer = t => {

    clearInterval(_boringTimer);

    _boringTimer = setInterval(() => {

        if (!myturn && !_guesser) {

            const OPTIONS = [
                '...',
                '[undefined]',
                'Boring...',
                `S${lDub('o')} boring...`,
                `S${lDub('o')} cute :3`,
                'Oh nice :3',
                'Nice drawing, though :3',
                'Awesome :3',
                'Oh great :3',
                `You're good at drawing :3`,
                `💡 ${RND(TIPS)}`
            ];

            ws.send(`42["data",{"id":30,"data":"${RND(OPTIONS)}"}]`);
        }

    }, t * 60000);
}


// Вытаскиваем игрока из массива по ID
const getPlayer = id => players.find(x => x.id == id);


// Отправка массива точек на сервер игры
const send2Server = async points => {

    let tmp = [];

    // Разбиваем массив точек на пакеты по 4 точки
    for (let i = 0; i < 4; i++) {
        if (points.length > 0) tmp.push(points.shift());
        else break;
    }


    ws.send(`42["data",{"id":19,"data":${JSON.stringify(tmp)}}]`);

    if (points.length > 0) send2Server(points);
}


// Отрисовка массива точек на канвас
const draw2Canvas = async (points, e) => {
    if (e == 'busy1') busy1 = true;
    if (e == 'busy2') busy2 = true;

    let tmp = [];

    // Разбиваем массив точек на пакеты по 4 точки
    for (let i = 0; i < 4; i++) {
        if (points.length > 0) tmp.push(points.shift());
        else break;
    }

    await pause(inputlag ? 12 : 1);
    canvas.drawCommands(tmp);

    if (points.length > 0) {
        draw2Canvas(points, e);
    } else {
        if (e == 'busy1') busy1 = false;
        if (e == 'busy2') busy2 = false;
    }
}



// Взаимодействие с интерфейсом

btn_connect.addEventListener('click', async () => {

    btn_connect.disabled = true;

    Login();
    clearLog();
    Log('Connecting...');

});


btn_disconnect.addEventListener('click', async () => {

    btn_disconnect.disabled = true;

    ws.send(`42["data",{"id":30,"data":"Got to go... Bye!!!"}]`);

    await pause(2000);

    Log('Closing connection...');

    ws.close();

    await pause(1000);

    onDisconnected();
    Log('Disconnected.');
});


con.addEventListener('input', e => {
    if (/skribbl.io\/\?(.+)/.test(con.value)) {
        Log(`Invite link accepted. (${join = RegExp.$1})`);
    }
});

con.addEventListener('keydown', e => {
    if (e.keyCode == 13) {
        if (con.value == 'list') Log(`List of words (${storage.length}): ${storage}`, 3);
        if (con.value == 'clear') log.innerHTML = '';
        con.value = '';
    }
});



con.addEventListener('click', () => join = con.value = '');


canvas_elem.addEventListener('dblclick', () => {
    canvas.clear();
    Log('Canvas clear!', 2);
});

engine_sel.addEventListener('change', () => s_engine = engine_sel.value);
dither_chk.addEventListener('change', () => dithering = dither_chk.checked);
inputlag_chk.addEventListener('change', () => inputlag = inputlag_chk.checked);
autoguess_chk.addEventListener('change', () => autoguess = autoguess_chk.checked);
autorate_chk.addEventListener('change', () => autorate = autorate_chk.checked);
autokick_chk.addEventListener('change', () => autokick = autokick_chk.checked);
sound_chk.addEventListener('change', () => sound = sound_chk.checked);
filter_chk.addEventListener('change', () => spamfilter = filter_chk.checked);


/* Лог */

const Log = (m, c = null) => {
    let color;
    if (c == 1) color = '#ff0';
    if (c == 2) color = '#2ef';
    if (c == 3) color = '#aaa';
    log.innerHTML += (c ? `<span style="color:${color}">` : "") + `${m}${c ? "</span>" : ""}<br>`;
    log.scrollTop = log.scrollHeight;
}

const clearLog = () => log.innerHTML = '';


let SAYINGS, JOKES;

// Формируем базу слов
chrome.storage.local.get(INIT, async s => {

    if (s.words.length == 0) {

        let response = await fetch('words.json');
        let data = await response.json();

        chrome.storage.local.set({ words: data.words });

        setWords(data);

    } else {

        setWords(s);
    }

    let response = await fetch('sayings.json');
    let data = await response.json();

    SAYINGS = data.sayings;
    JOKES = data.jokes;

});

const setWords = data => {
    storage = data.words;
    wordlist = data.words;
    Log(`Words in base: ${wordlist.length}`, 3);
}