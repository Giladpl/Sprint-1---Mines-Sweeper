'use strict';

//Global Variables:
const MINE = '💩';
const FLAG = '🚩';
const EMPTY = ' ';

var gBoard;
var gIsFirst = true;
var gTimerInterval = null;
var gSeconds = 0;
var gLevel = [
	{ SIZE: 4, MINES: 2 },
	{ SIZE: 8, MINES: 12 },
	{ SIZE: 12, MINES: 30 },
];
var gGame = { isOn: false, shownCount: 0, flaggedCount: 0, secsPassed: 0 };

function init(size, mines) {
	gBoard = buildBoard(size);
	setRandomMines(gBoard, size, mines);
	setMinesNegsCount(gBoard);
	renderBoard(gBoard);
	disableRightClick();
}

function buildBoard(size) {
	var playBoard = [];

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
			var className = 'hidden';
			var cellContent = EMPTY;
			if (cell.isMine) className = 'mine';
			strHTML += `\t<td class="cell ${className}" 
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
			currCell.minesAroundCount = negMines.negCount;
			currCell.minesAroundLocations = negMines.posNegMines;
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

function setRandomMines(board, size, minesNum) {
	var minesLocations = [];
	for (var i = 0; i < minesNum; i++) {
		var iPos = getRandomIntInclusive(0, size - 1);
		var jPos = getRandomIntInclusive(0, size - 1);
		minesLocations.push({ iPos, jPos });
		board[iPos][jPos].isMine = true;
	}
	return minesLocations;
}

function cellClicked(elCell, event, i, j) {
	// if(event.button === 0) console.log('left clicked');
	// if(event.button === 2) console.log('right clicked');
	if (gIsFirst) {
		gTimerInterval = setInterval(setTime, 1000); //add support for left click start
		gIsFirst = !gIsFirst;
	} else gIsFirst = false;

	var currCell = gBoard[i][j];
	if (currCell.isShown) return;

	if (event.button === 2 && !currCell.isShown) {
		//left mouse clicked
		elCell.classList.toggle('flagged');
		currCell.isMarked = !currCell.isMarked;
		elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
	} else {
		//right mouse clicked
		currCell.isShown = true;
		//revealing cell's content
		if (currCell.isMine) {
			elCell.innerText = MINE;
		} else {
			elCell.innerText = currCell.minesAroundCount;
			elCell.classList.add('revealed');
		}
	}
}

function setTime() {
	++gSeconds;
	document.querySelector('.sec').innerText = padTime(gSeconds % 60);
	document.querySelector('.min').innerText = ` ${padTime(
		parseInt(gSeconds / 60)
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

function gameOver() {}

function resetGame() {
	clearInterval(gTimerInterval);
	gTimerInterval = null;
}
