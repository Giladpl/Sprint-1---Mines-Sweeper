'use strict';

//Global Variables:
const MINE = '💩';
const FLAG = '🚩';
const EMPTY = ' ';
const LIVES = '❤️';

var gBoard;
var gIsFirst = true;
var gHintMode = false;
var gSeconds = 0;
var gLevelPlayed;
var gGameInterval;
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
};

function init(level) {
	gLevelPlayed = level;
	gBoard = buildBoard(gLevelPlayed);
	setRandomMines(gBoard, gLevelPlayed);
	setMinesNegsCount(gBoard);
	renderBoard(gBoard);
	disableRightClick();
	setLivesSmileySafe(gGame.livesLeft);
	showRecords();
	clearInterval(gGameInterval);
	document.querySelector('.timer').innerHTML =
		'Time Passed:<span class="min"></span> <span class="sec"> </span>'; //Should create a new func to clear the int
} //more over, when switching level, timer won't reset- should be fixed.

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

function setRandomMines(board, level) {
	var minesLocations = [];
	var size = gLevel[level].SIZE;
	var minesNum = gLevel[level].MINES;
	for (var i = 0; i < minesNum; i++) {
		var iPos = getRandomIntInclusive(0, size - 1);
		var jPos = getRandomIntInclusive(0, size - 1);
		minesLocations.push({ iPos, jPos });
		board[iPos][jPos].isMine = true;
	}
	return minesLocations;
}

function cellClicked(elCell, event, i, j) {
	var currCell = gBoard[i][j];
	if (!gGame.isOn) return;

	if (gHintMode) {
		expandShown(gBoard, i, j);
		document.querySelector('.board').style.cursor = 'default';
		gHintMode = false;
		return;
	}

	if (gIsFirst) {
		gGameInterval = setInterval(setTime, 1000);
		gIsFirst = !gIsFirst;
	}

	if (currCell.isShown) return;

	if (event.button === 2 && !currCell.isShown) {
		//right mouse clicked
		cellMarked(elCell, currCell); //mark with flag
		checkGameOver();
	} else {
		//left mouse clicked
		currCell.isShown = true;
		if (currCell.isMine) {
			//stepped on a mine
			gGame.minesMissed++;
			elCell.innerText = MINE;
			setLivesSmileySafe(--gGame.livesLeft);
			if (gGame.livesLeft) return;
			gGame.isOn = false;
			setTimeout(gameOver, 2000, 0);
		} else {
			// Cell is not a mine- can be revealed
			elCell.innerText =
				currCell.minesAroundCount === 0
					? EMPTY
					: currCell.minesAroundCount;
			elCell.classList.add('revealed');
			gGame.shownCount++;
			if (currCell.minesAroundCount === 0) expandShown(gBoard, i, j); //check the negs if able to also reveal them0 only first layer for now
			checkGameOver();
		}
	}
}
function cellMarked(elCell, currCell) {
	elCell.classList.toggle('flagged');
	currCell.isMarked = !currCell.isMarked;
	elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
	if (currCell.isMine) gGame.flaggedCount++; //BUG- flagging and unflagging of a mined cell would result in a problem with gameover.
}

function setTime() {
	gGame.secsPassed++;
	document.querySelector('.sec').innerText = padTime(gGame.secsPassed % 60);
	document.querySelector('.min').innerText = ` ${padTime(
		parseInt(gGame.secsPassed / 60)
	)} :`;
}

function padTime(val) {
	//add to the set time func
	var valString = val + '';
	if (valString.length < 2) {
		return '0' + valString;
	} else {
		return valString;
	}
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

function resetGame() {
	clearInterval(gGameInterval);
	gGame.hintsLeft = 3;
	gGame.minesMissed = 0;
	gGame.secsPassed = 0;
	gGame.livesLeft = 3;
	gGame.safeClickLeft = 3;
	gGame.flaggedCount = 0;
	document.querySelector(
		'.safe-remaining'
	).innerText = `${gGame.safeClickLeft}`;
	gIsFirst = true;
	document.querySelector('.timer').innerHTML =
		'Time Passed:<span class="min"></span> <span class="sec"> </span>';
	init(gLevelPlayed);
	document.querySelector('.modal').classList.add('hidden');
	document.querySelector('.overlay').classList.add('hidden');
	gGame.shownCount = 0;
	gGame.isOn = true;
}
//Still need to work on- violating DRY principle big time
function expandShown(board, rowIdx, colIdx) {
	//Bug with the way it reveals.
	var currCell = board[rowIdx][colIdx];
	// if (!currCell.minesAroundCount &&  !gHintMode)
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
			// console.log(elNegCell);
			elNegCell.classList.add('revealed');
			elNegCell.innerText =
				currCell.minesAroundCount === 0
					? EMPTY
					: currCell.minesAroundCount;
			checkGameOver();

			if (gHintMode) {
				setTimeout(function () {
					gGame.shownCount--;
					currCell.isShown = false;
					elNegCell.classList.remove('revealed');
					elNegCell.innerText = EMPTY;
				}, 1500);
			}
		}
	}
}

function setLivesSmileySafe(lives) {
	document.querySelector(
		'.safe-remaining'
	).innerText = `${gGame.safeClickLeft}`;
	var elLives = document.querySelector('.lives');
	var elSmiley = document.querySelector('.smiley');

	if (gGame.livesLeft) elLives.innerText = LIVES.repeat(lives);
	else elLives.innerText = 'You are dead ⚰️';

	if (gGame.livesLeft === 3) elSmiley.innerText = '😁';
	else if (gGame.livesLeft === 2) elSmiley.innerText = '🙂';
	else if (gGame.livesLeft === 1) elSmiley.innerText = '😏';
	else elSmiley.innerText = '🤯';

	// document.querySelector('.messages').innerText = `Shit! You should be more careful!`
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

function getHintMode() {
	gHintMode = true;
	if (gGame.hintsLeft > 0) gGame.hintsLeft--;
	document.querySelector('.board').style.cursor = 'zoom-in';
}

function gameOver(reason) {
	console.log('inside gameOver');

	var elSpan = document.querySelector('.gameOver-msg');
	if (!reason)
		elSpan.innerText = `Damn, you stepped on a 💩! Would you like to play another round?`;
	else saveRecord();
	elSpan.innerText = `Good job, you've made it! 🎉 Maybe try the harder version?`;
	document.querySelector('.modal').classList.remove('hidden');
	document.querySelector('.overlay').classList.remove('hidden');
	clearInterval(gGameInterval);
}

function saveRecord() {
	var currentLvl;
	if (gLevelPlayed === 0) currentLvl = 'Easy';
	else if (gLevelPlayed === 1) currentLvl = 'Medium';
	else currentLvl = 'Hard';

	var currRecord = +localStorage.getItem(`${currentLvl}`);

	if (currRecord > gGame.secsPassed || !currRecord)
		localStorage.setItem(`${currentLvl}`, gGame.secsPassed);
}

function showRecords() { //to fix - should show the time not only as seconds but as 00:00
	var easyRec = localStorage.getItem(`Easy`);
	document.querySelector('.easy-record').innerText = easyRec;
	var MediumRec = localStorage.getItem(`Medium`);
	document.querySelector('.medium-record').innerText = MediumRec;
	var HardRec = localStorage.getItem(`Hard`);
	document.querySelector('.hard-record').innerText = HardRec;
}

function checkGameOver() {
	if (
		gGame.flaggedCount + gGame.minesMissed === gLevel[gLevelPlayed].MINES &&
		gLevel[gLevelPlayed].SIZE ** 2 - gLevel[gLevelPlayed].MINES ===
			gGame.shownCount
	)
		setTimeout(gameOver, 2000, 1);

	// 	return;
	// else if (
	// 	gGame.flaggedCount === gLevel[gLevelPlayed].MINES &&
	// 	Math.pow(gLevel[gLevelPlayed].SIZE, 2) - gLevel[gLevelPlayed].MINES ===
	// 		gGame.shownCount
	// )
	// 	gameOver(1);
	// else gameOver();
}
