'use strict';

//Global Variables:
const MINE = '💩';
const FLAG = '🚩';
const EMPTY = ' ';
const LIVES = '❤️';

var gBoard;
var gFirstClick = true;
var gHintMode = false;
var gLevelPlayed;
var gGameInterval;
var gToggleManual = false;
var gLevel = [
	{ SIZE: 4, MINES: 2 },
	{ SIZE: 8, MINES: 12 },
	{ SIZE: 12, MINES: 30 },
];
var gGame = {
	isOn: true,
	shownCount: 0,
	flaggedCount: 0,
	secsPassed: 0,
	livesLeft: 3,
	safeClickLeft: 3,
	hintsLeft: 3,
	minesMissed: 0,
	manualMode: false,
	minesNumManual: 0,
};

function init(level) {
	if (gGame.manualMode) cancelManual();
	gLevelPlayed = level;
	gBoard = buildBoard(gLevelPlayed);
	setRandomMines(gBoard, gLevelPlayed);
	setMinesNegsCount(gBoard);
	renderBoard(gBoard);
	disableRightClick();
	resetTimer();
	showRecords();
	resetGameModel();
	setBtnsParameters();
}

function buildBoard(level) {
	var playBoard = [];
	var size = gLevel[level].SIZE;
	for (var i = 0; i < size; i++) {
		playBoard[i] = [];
		for (var j = 0; j < size; j++) {
			var cell = {
				minesAroundCount: 0,
				isShown: false,
				isMine: false,
				isMarked: false,
			};
			playBoard[i][j] = cell;
		}
	}
	// console.table(playBoard);
	return playBoard;
}

function renderBoard(board) {
	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += `<tr class="field-row" >`;
		for (var j = 0; j < board[0].length; j++) {
			var cell = board[i][j];
			var cellContent = EMPTY;
			if (cell.isMine) var className = 'mine';
			else var className = `negCount-${cell.minesAroundCount}`;
			strHTML += `\t<td data-i="${i}" data-j="${j}" class="cell ${className}" 
															onmousedown="cellClicked(this, event, ${i}, ${j})" >${cellContent}</td>\n`;
		}
		strHTML += `</tr>`;
	}
	// console.log(strHTML)

	var elField = document.querySelector('.mines-field');
	elField.innerHTML = strHTML;
}

function setMinesNegsCount(board) {
	var negMines = null;
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];
			negMines = checkMinesNegsCount(board, i, j);
			if (negMines.negCount) {
				currCell.minesAroundCount = negMines.negCount;
				currCell.minesAroundLocations = negMines.posNegMines;
			}
			negMines = null;
		}
	}
}

function checkMinesNegsCount(board, rowIdx, colIdx) {
	var posNegMines = [];
	var negCount = 0;
	for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
		if (i < 0 || i > board.length - 1) continue;
		for (var j = colIdx - 1; j <= colIdx + 1; j++) {
			var currCell = board[i][j];
			if (j < 0 || j > board[0].length - 1) continue;
			if (i === rowIdx && j === colIdx) continue;
			if (!currCell.isMine) continue;
			posNegMines.push({ row: i, column: j });
			negCount++;
		}
	}
	return { negCount, posNegMines };
}
//Wrote in the util file another option- setOneMineLocation combined with a shorter setRandomMines.
//Still need to decide which way is better.
function setRandomMines(board, level) {
	var minesLocations = [];
	var size = gLevel[level].SIZE;
	var minesNum = gLevel[level].MINES;
	while (minesLocations.length !== minesNum) {
		var iPos = getRandomIntInclusive(0, size - 1);
		var jPos = getRandomIntInclusive(0, size - 1);
		var currCell = board[iPos][jPos];
		if (!currCell.isMine) {
			currCell.isMine = true;
			minesLocations.push({ iPos, jPos });
		}
	}
	return minesLocations;
}

function cellMarked(elCell, currCell) {
	elCell.classList.toggle('flagged');
	if (currCell.isMine) {
		currCell.isMarked ? gGame.flaggedCount-- : gGame.flaggedCount++;
	}
	currCell.isMarked = !currCell.isMarked;
	elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
}

function setTime() {
	gGame.secsPassed++;
	document.querySelector('.sec').innerText = padTime(gGame.secsPassed % 60);
	document.querySelector('.min').innerText = ` ${padTime(
		parseInt(gGame.secsPassed / 60)
	)} :`;
}

function disableRightClick() {
	window.addEventListener(
		'contextmenu',
		function (e) {
			e.preventDefault();
		},
		false
	);
}

function cellClicked(elCell, event, i, j) {
	var currCell = gBoard[i][j];
	if (!gGame.isOn) return;
	if (currCell.isShown) return;
	if (gGame.manualMode) {
		manualMinePlacement(i, j, elCell);
		return;
	}

	if (gHintMode && gGame.hintsLeft >= 0) {
		//Hint Mode
		expandHintMode(gBoard, i, j);
		document.querySelector('.board').style.cursor = 'default';
		gHintMode = false;
		return;
	}
	if (event.buttons === 1) {
		// Left clicked
		currCell.isShown = true;
		if (!gGame.shownCount) {
			//If first click of the game
			gGameInterval = setInterval(setTime, 1000);
			if (currCell.isMine) {
				// Model of the previously positioned mine
				currCell.isMine = false;
				//Model of the new non-mined cell
				var emptyPos = findEmptyPos();
				gBoard[emptyPos.i][emptyPos.j].isMine = true;
				// Adjust the counts of negs onboard
				setMinesNegsCount(gBoard);
				renderBoard(gBoard);
				elCell = document.querySelector(
					`[data-i="${i}"][data-j="${j}"]`
				);
			}
		}
		if (!currCell.isMine) {
			//Not a mine
			elCell.innerText =
				currCell.minesAroundCount === 0
					? EMPTY
					: currCell.minesAroundCount;
			elCell.classList.add('revealed');
			gGame.shownCount++;
			if (currCell.minesAroundCount === 0) expandShown(gBoard, i, j); //check the negs if able to also reveal them0 only first layer for now
		} else if (currCell.isMine && gGame.shownCount) {
			//on mine- non first click in game
			gGame.minesMissed++;
			elCell.innerText = MINE;
			--gGame.livesLeft;
			setBtnsParameters();
			if (!gGame.livesLeft) {
				gGame.isOn = false;
				revealAllMines(gBoard);
				setTimeout(gameOver, 1000, 1);
			}
		}
	} else if (event.button === 2 && !currCell.isShown) {
		// Right click on the mouse
		cellMarked(elCell, currCell); //mark with flag
	}
	checkGameOver();
}

function resetTimer() {
	clearInterval(gGameInterval);
	document.querySelector('.timer').innerHTML =
		'Time:<span class="min"></span> <span class="sec"> </span>';
}

function resetGameModel() {
	gGame.hintsLeft = 3;
	gGame.minesMissed = 0;
	gGame.secsPassed = 0;
	gGame.livesLeft = 3;
	gGame.safeClickLeft = 3;
	gGame.flaggedCount = 0;
	gGame.shownCount = 0;
	gGame.isOn = true;

	resetTimer();
}

function resetGame() {
	resetGameModel();
	setBtnsParameters();
	document.querySelector(
		'.safe-remaining'
	).innerText = `${gGame.safeClickLeft}`;
	init(gLevelPlayed);
	closeModal();
	gGame.minesNumManual = 0;
	gGame.manualMode = false;
	
}
//Still need to work on- violating DRY principle
function expandShown(board, rowIdx, colIdx) {
	var currCell = board[rowIdx][colIdx];
	for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
		if (i < 0 || i > board.length - 1) continue;
		for (var j = colIdx - 1; j <= colIdx + 1; j++) {
			var currCell = board[i][j];
			if (j < 0 || j > board[0].length - 1) continue;
			if (i === rowIdx && j === colIdx) continue;
			else if (currCell.isMarked || currCell.isMine || currCell.isShown)
				continue;

			currCell.isShown = true;
			gGame.shownCount++;
			var elNegCell = document.querySelector(
				`[data-i="${i}"][data-j="${j}"]`
			);
			elNegCell.classList.add('revealed');
			elNegCell.innerText =
				currCell.minesAroundCount === 0
					? EMPTY
					: currCell.minesAroundCount;
			if (currCell.minesAroundCount === 0) expandShown(board, i, j); //Recursion in order to open up more than one layer if possible

			checkGameOver();
		}
	}
}

function setBtnsParameters() {
	document.querySelector(
		'.safe-remaining'
	).innerText = `${gGame.safeClickLeft}`;
	var elLives = document.querySelector('.lives');
	var elSmiley = document.querySelector('.smiley');

	if (gGame.livesLeft) elLives.innerText = LIVES.repeat(gGame.livesLeft);
	else elLives.innerText = 'You are dead ⚰️';

	if (gGame.livesLeft === 3) elSmiley.innerText = '😁';
	else if (gGame.livesLeft === 2) elSmiley.innerText = '🙂';
	else if (gGame.livesLeft === 1) elSmiley.innerText = '😏';
	else elSmiley.innerText = '🤯';

	document.querySelector('.hint-remaining').innerText = '🔎'.repeat(
		gGame.hintsLeft
	);
}

function safeClick() {
	if (!gGame.safeClickLeft) return;
	gGame.safeClickLeft--;
	var emptyCellsLoc = getEmptyCells(gBoard);
	var randEmptyCellPos =
		emptyCellsLoc[getRandomIntInclusive(0, emptyCellsLoc.length - 1)];
	// console.log(randEmptyCellPos);
	var elSafeCell = document.querySelector(
		`[data-i="${randEmptyCellPos.i}"][data-j="${randEmptyCellPos.j}"]`
	);
	// console.log(elSafeCell);
	document.querySelector(
		'.safe-remaining'
	).innerText = `${gGame.safeClickLeft}`;
	elSafeCell.classList.toggle('safe-cell');
	setTimeout(function () {
		elSafeCell.classList.toggle('safe-cell');
	}, 1000);
}

function expandHintMode(board, rowIdx, colIdx) {
	var currCell = board[rowIdx][colIdx];
	for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
		if (i < 0 || i > board.length - 1) continue;
		for (var j = colIdx - 1; j <= colIdx + 1; j++) {
			var currCell = board[i][j];
			if (j < 0 || j > board[0].length - 1) continue;
			if (currCell.isShown) continue;

			var elNegCell = document.querySelector(
				`[data-i="${i}"][data-j="${j}"]`
			);
			elNegCell.classList.add('hint');

			if (currCell.minesAroundCount === 0) {
				elNegCell.innerText = EMPTY;
			}
			if (currCell.minesAroundCount > 0) {
				elNegCell.innerText = currCell.minesAroundCount;
			}
			if (currCell.isMine) {
				elNegCell.innerText = MINE;
			}
			setTimeout(hideHint, 1500, elNegCell, currCell);
		}
	}
}

function hideHint(elNegCell, currCell) {
	elNegCell.classList.remove('hint');
	if (currCell.isMine) {
		elNegCell.innerText = EMPTY;
	}
	if (currCell.minesAroundCount > 0) {
		elNegCell.innerText = EMPTY;
	}
	if (currCell.isMarked) {
		elNegCell.innerText = FLAG;
	}
}

function goHintMode() {
	gHintMode = true;
	if (gGame.hintsLeft > 0) gGame.hintsLeft--;
	document.querySelector('.hint-remaining').innerText = '🔎'.repeat(
		gGame.hintsLeft
	);
	document.querySelector('.board').style.cursor = 'zoom-in';
}

function gameOver(reason) {
	var elSpan = document.querySelector('.gameOver-msg');
	document.querySelector('.modal').classList.remove('hidden');
	document.querySelector('.overlay').classList.remove('hidden');
	clearInterval(gGameInterval);
	if (reason)
		elSpan.innerText = `Damn, you stepped on a 💩! Would you like to play another round?`;
	else if (gGame.minesMissed)
		elSpan.innerText = `Good job! 🎉 Although you've got some 💩 on your shoe!`;
	else {
		elSpan.innerText = `Good job, you've made it perfectly! 🎉 Maybe try a harder level?`;
	}
	saveRecord();
}

function checkGameOver() {
	if (
		(gGame.flaggedCount + gGame.minesMissed ===
			gLevel[gLevelPlayed].MINES &&
			gLevel[gLevelPlayed].SIZE ** 2 - gLevel[gLevelPlayed].MINES ===
				gGame.shownCount) ||
		(gGame.flaggedCount + gGame.minesMissed === gGame.minesNumManual &&
			gLevel[gLevelPlayed].SIZE ** 2 - gGame.minesNumManual ===
				gGame.shownCount)
	) {
		document.querySelector('.smiley').innerText = '😎';
		setTimeout(gameOver, 2000);
	}
}

function saveRecord() {
	var currentLvl;
	var minutes = padTime(Math.floor(gGame.secsPassed / 60));
	var seconds = padTime(gGame.secsPassed - minutes * 60);
	var finalTime = `${minutes}:${seconds}`;

	if (gLevelPlayed === 0) currentLvl = 'Easy';
	else if (gLevelPlayed === 1) currentLvl = 'Medium';
	else currentLvl = 'Hard';

	var currRecord = +localStorage.getItem(`${currentLvl}`);

	if (currRecord > gGame.secsPassed || !currRecord)
		localStorage.setItem(`${currentLvl}`, `${finalTime}`);
}

function showRecords() {
	document.querySelector('.easy-record').innerText = localStorage.getItem(
		`Easy`
	);
	document.querySelector('.medium-record').innerText = localStorage.getItem(
		`Medium`
	);
	document.querySelector('.hard-record').innerText = localStorage.getItem(
		`Hard`
	);

	var elRecords = document.querySelectorAll('.rec-time');
	for (var i = 0; i < elRecords.length; i++) {
		if (!elRecords[i].innerText)
			elRecords[i].innerText = 'No current record';
	}
}

function revealAllMines(board) {
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];
			var elNegCell = document.querySelector(
				`[data-i="${i}"][data-j="${j}"]`
			);
			if (currCell.isMine) {
				currCell.isShown;
				elNegCell.innerText = MINE;
				elNegCell.classList.add('.revealed');
			}
		}
	}
}
//DRY- revealAllMines and getEmptyCells can and should be combined into one util functions
function getEmptyCells(board) {
	var emptyCells = [];
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			var cell = board[i][j];
			if (!cell.isMine && !cell.isShown) emptyCells.push({ i, j });
		}
	}
	return emptyCells;
}

function goManual(elBtnManual) {
	elBtnManual.classList.toggle('go-manual');
	elBtnManual.innerText = 'Begin';
	resetTimer();
	resetGameModel();
	setBtnsParameters();
	renderBoard(gBoard);
	if (elBtnManual.classList.contains('go-manual')) {
		gGame.manualMode = true;
		gBoard = buildBoard(gLevelPlayed);
	} else {
		gGame.manualMode = false;
		setMinesNegsCount(gBoard);
		renderBoard(gBoard);
		elBtnManual.innerText = 'Manual';
	}
}

function manualMinePlacement(i, j, elCell) {
	gBoard[i][j].isMine = true;
	elCell.innerText = MINE;
	gGame.minesNumManual++;
}

function cancelManual() {
	resetGameModel();
	setBtnsParameters();
	gGame.minesNumManual = 0;
	gGame.manualMode = false;
	var elManual = document.querySelector('.btn-grad');
	if (elManual.classList.contains('go-manual')) {
		elManual.classList.remove('go-manual');
	}
	elManual.innerText = 'Manual';
}

function closeModal() {
	document.querySelector('.modal').classList.add('hidden');
	document.querySelector('.overlay').classList.add('hidden');
}
