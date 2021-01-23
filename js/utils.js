function printMat(mat, selector) {
	var strHTML = '<table border="0"><tbody>';
	for (var i = 0; i < mat.length; i++) {
		strHTML += '<tr>';
		for (var j = 0; j < mat[0].length; j++) {
			var cell = mat[i][j];
			var className = 'cell cell' + i + '-' + j;
			strHTML += '\t<td class="' + className + '"> ' + cell + ' </td>\n';
		}
		strHTML += '</tr>';
	}
	strHTML += '</tbody></table>';
	var elContainer = document.querySelector(selector);
	elContainer.innerHTML = strHTML;
}

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

function getRandomIntExclusive(min, max) {
	//exclusive
	return Math.random() * (max - min) + min;
}

// function str_pad_left(string, pad, length) {
// 	return (new Array(length + 1).join(pad) + string).slice(-length);
// }

function padTime(value) {
	//part of set time function
	var valueString = value + '';
	if (valueString.length < 2) {
		return '0' + valueString;
	} else {
		return valueString;
	}
}
// location such as: {i: 2, j: 7}
function renderCell(location, value) {
	// Select the elCell and set the value
	var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
	elCell.innerHTML = value;
}
//render cell by data-i and data -j
function renderCellByData(i, j, value) {
	var elNegCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
	elNegCell.innerHTML = value;
}

function getCellCoord(strCellId) {
	var parts = strCellId.split('-');
	var coord = { i: +parts[1], j: +parts[2] };
	return coord;
}

function findEmptyPos() {
	var emptyPositions = [];
	for (var i = 0; i < gBoard.length; i++) {
		for (var j = 0; j < gBoard.length; j++) {
			var cell = gBoard[i][j];
			if (!gGame.isMine) {
				emptyPositions.push({ i: i, j: j });
			}
		}
	}
	var randIdx = getRandomIntInclusive(0, emptyPositions.length - 1);
	var randPos = emptyPositions[randIdx];
	return randPos;
}

function getPos(strPos) {
	var parts = strPos.split(',');
	var pos = { i: +parts[0], j: +parts[1] };
	return pos;
}

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

// Another way of attack for handling the first mine problem.. Should still decide which one to use
// function setOneMineLocation(board, size) {
// 	var iPos = getRandomIntInclusive(0, size - 1);
// 	var jPos = getRandomIntInclusive(0, size - 1);
// 	var currCell = board[iPos][jPos];
// 	while (currCell.isMine) {
// 		iPos = getRandomIntInclusive(0, size - 1);
// 		jPos = getRandomIntInclusive(0, size - 1);
// 		currCell = board[iPos][jPos];
// 	}
// 	currCell.isMine = true;
// 	return { iPos, jPos };
// }
// function setRandomMines(board, level) {
// 	var minesLocations = [];
// 	var size = gLevel[level].SIZE;
// 	var minesNum = gLevel[level].MINES;
// 	while (minesLocations.length !== minesNum) {
// 		minesLocations.push(setOneMineLocation(board, size));
// 	}
// 	return minesLocations;
// }
// function firstCellIsMine(board, level, i, j){
// 	var size = gLevel[level].SIZE;
// 	board[i][j].isMine = false
// 	return setOneMineLocation(board, size);
// }