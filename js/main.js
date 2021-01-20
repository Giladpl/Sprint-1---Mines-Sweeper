'use strict';

//Global Variables:
const MINE = '💩';
const FLAG = '🚩';
const EMPTY = ' ';

var gBoard;
var gIsFirst = true;
var gSeconds = 0;
var gLevelPlayed;
var gGameInterval;
var gLevel = [
	{ SIZE: 4, MINES: 2 },
	{ SIZE: 8, MINES: 12 },
	{ SIZE: 12, MINES: 30 },
];
var gGame = { isOn: true, shownCount: 0, flaggedCount: 0, secsPassed: 0 };

function init(level) {
	gLevelPlayed = level;
	gBoard = buildBoard(gLevelPlayed);
	setRandomMines(gBoard, gLevelPlayed);
	setMinesNegsCount(gBoard);
	renderBoard(gBoard);
	disableRightClick();
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
	if (!gGame.isOn) return;
	if (gIsFirst) {
		gGameInterval = setInterval(setTime, 1000);
		gIsFirst = !gIsFirst;
	} else gIsFirst = false;

	var currCell = gBoard[i][j];
	if (currCell.isShown) return;

	if (event.button === 2 && !currCell.isShown) {
		//left mouse clicked
		cellMarked(elCell, currCell);
	} else {
		//right mouse clicked
		currCell.isShown = true;
		if (currCell.isMine) {
			gGame.isOn = false;
			elCell.innerText = MINE;
			setTimeout(gameOver, 1500, 0);
		} else {
			elCell.innerText = currCell.minesAroundCount;
			elCell.classList.add('revealed');
			gGame.shownCount++;
			expandShown(gBoard, i, j);
			if (
				gGame.flaggedCount === gLevel[gLevelPlayed].MINES &&
				Math.pow(gLevel[gLevelPlayed].SIZE, 2) -
					gLevel[gLevelPlayed].MINES ===
					gGame.shownCount
			)
				gameOver(1);
		}
	}
}
function cellMarked(elCell, currCell) {
	elCell.classList.toggle('flagged');
	currCell.isMarked = !currCell.isMarked;
	elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
	if (currCell.isMine) gGame.flaggedCount++;
}

function setTime() {
	gGame.secsPassed++;
	document.querySelector('.sec').innerText = padTime(gGame.secsPassed % 60);
	document.querySelector('.min').innerText = ` ${padTime(
		parseInt(gGame.secsPassed / 60)
	)} :`;
}

function padTime(val) {
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

function gameOver(reason) {
	var elSpan = document.querySelector('.gameOver-msg');
	if (!reason)
		elSpan.innerText = `Damn, you stepped on a 💩! Would you like to play another round?`;
	else
		elSpan.innerText = `Good job, you've made it! 🎉 Maybe try the harder version?`;
	document.querySelector('.modal').classList.remove('hidden');
	document.querySelector('.overlay').classList.remove('hidden');
	clearInterval(gGameInterval);

}

function resetGame() {
	gGame.secsPassed = 0;
	gIsFirst = true;
	document.querySelector('.timer').innerHTML =
		'Time Passed:<span class="min"></span> <span class="sec"> </span>';
	init(gLevelPlayed);
	document.querySelector('.modal').classList.add('hidden');
	document.querySelector('.overlay').classList.add('hidden');
	gGame.shownCount = 0;
	gGame.isOn = true;
}
function checkGameOver() {}

//Still need to perfect- violating DRY principle big time
function expandShown(board, rowIdx, colIdx) {
	var currCell = board[rowIdx][colIdx];
	if (!currCell.minesAroundCount)
		for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
			if (i < 0 || i > board.length - 1) continue;
			for (var j = colIdx - 1; j <= colIdx + 1; j++) {
				var currCell = board[i][j];
				if (j < 0 || j > board[0].length - 1) continue;
				if (i === rowIdx && j === colIdx) continue;
				if (currCell.isMine) continue;
				var elNegCell = document.querySelector(
					`[data-i="${i}"][data-j="${j}"]`
				);
				elNegCell.classList.add('revealed');
				elNegCell.innerText = currCell.minesAroundCount;
				gGame.shownCount++;
			}
		}
}
