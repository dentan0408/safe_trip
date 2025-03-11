// Board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird
let birdWidth = 80;
let birdHeight = 50;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

// Pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 500;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// Australia & Osaka images
let ausImg = new Image();
ausImg.src = "./australia.png";

let osaImg = new Image();
osaImg.src = "./osaka.png";

// Moving objects for Australia & Osaka
let australia = { img: ausImg, x: pipeX, y: boardHeight / 3, active: true };
let osaka = { img: osaImg, x: pipeX + 1000, y: boardHeight / 3, active: true };

// Physics
let velocityX = -2; // Pipes & Images move left
let velocityY = 0; // Bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
const maxScore = 3; // Score needed to trigger Osaka
let pipeCount = 0; // Track number of pipes

// Preload GIF & Victory Sound
let congratsGif = new Image();
congratsGif.src = "./congrats.gif";

let victorySound = new Audio("./victory.mp3");

// Detect user interaction (fixes sound autoplay issue on mobile)
let userInteracted = false;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load bird image
    birdImg = new Image();
    birdImg.src = "./Lawson.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); // Every 1.5 seconds
    document.addEventListener("keydown", moveBird);
    document.addEventListener("touchstart", moveBird, { passive: false }); // Add touch support
};

function update() {
    if (gameOver) {
        return;
    }

    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    // 🇦🇺 Move Australia at game start
    if (australia.active) {
        australia.x += velocityX; // Move left
        context.drawImage(australia.img, australia.x - 200, australia.y + 230, 150, 150);
        context.fillStyle = "white";
        context.font = "bold 20px sans-serif";
        context.fillText("Good luck!", australia.x - 180, australia.y + 210);
        
        // Remove Australia when off-screen
        if (australia.x < -100) {
            australia.active = false;
        }
    }

    // 🇯🇵 Move Osaka when it appears
    if (osaka.active) {
        osaka.x += velocityX; // Move left
        context.drawImage(osaka.img, osaka.x, osaka.y + 290, 100, 100);
        context.fillStyle = "white";
        context.shadowColor = "blue";
        context.shadowBlur = 1;
        context.font = "bold 20px sans-serif";
        context.fillText("ようこそ!🇯🇵", osaka.x, osaka.y + 270);
    }

    // 🏆 Stop the game & show Congrats GIF when bird reaches Osaka
    if (bird.x >= osaka.x) {
        gameOver = true;
        document.getElementById("board").style.display = "none"; // Hide the game canvas

        // 🎉 Create and show the GIF in the document body
        let gifElement = document.createElement("img");
        gifElement.src = "./congrats.gif";
        gifElement.style.position = "absolute";
        gifElement.style.left = "50%";
        gifElement.style.top = "50%";
        gifElement.style.transform = "translate(-50%, -50%)";
        gifElement.style.width = "80vw"; // Scales well on mobile
        gifElement.style.maxWidth = "360px"; // Prevents it from getting too large
        gifElement.style.height = "auto";
        document.body.appendChild(gifElement);

        // Play victory sound if user interacted (fixes autoplay issue on mobile)
        if (userInteracted) {
            victorySound.play();
        }

        return;
    }

    // Bird physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    // Pipes movement
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Remove off-screen pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Score display
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    if (gameOver && bird.x < osaka.x) {
        context.fillText("GAME OVER", 5, 90);
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 2;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(bottomPipe);

    pipeCount++;
}

function moveBird(e) {
    if (gameOver) {
        return;
    }

    // Detect user interaction (Fixes mobile sound autoplay issue)
    userInteracted = true;

    if (e.type === "touchstart" || e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        velocityY = -6;
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width && 
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&  
           a.y + a.height > b.y;
}