'use strict'

const MARKED = '🚩'
const MINE = '💥'

var gBoard

var gLevel = {
    size: 4,
    mines: 2,
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
}

function onInit() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    
    createBoard()
    setMinesNegsCount()
    renderBoard()
    // revealMines()
}

function createBoard() {
    gBoard = createMat(gLevel.size, gLevel.size)
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            gBoard[i][j] = {
                minesAroundCount: undefined,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }
    // gBoard[1][1].isMine = gBoard[2][3].isMine = true
    for (var i = 0; i < gLevel.mines; i++){
        var currCell = findRandomNonMineCell()
        gBoard[currCell.i][currCell.j].isMine = true
    }
}

function renderBoard() {
    var elBoard = document.querySelector('.board')
    var strHtml = '<table>'
    for (var i = 0; i < gBoard.length; i++) {
        strHtml += '<tr>'
        for (var j = 0; j < gBoard[i].length; j++) {
            strHtml += `<td class="cell cell-${i}-${j}"
            onclick="onCellClicked(this, ${i}, ${j})"
            oncontextmenu="onRightClick(this, ${i}, ${j})"
            ></td>`
        }
        strHtml += '</tr>'
    }
    strHtml += '</table>'
    elBoard.innerHTML = strHtml
}

function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var minesAround = countMinesAround(i, j)
            gBoard[i][j].minesAroundCount = minesAround
        }
    }
}

function countMinesAround(rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            var currCell = gBoard[i][j]
            if (currCell.isMine) {
                count++
            }
        }
    }
    return count
}

function onCellClicked(elCell, rowIdx, colIdx) {
    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isMarked || currCell.isShown || !gGame.isOn) return
    
    currCell.isShown = true
    gGame.shownCount++

    if (currCell.isMine) {
        elCell.style.backgroundColor = 'red'
        checkGameState(true)
    }


    elCell.innerText = currCell.isMine ? MINE : currCell.minesAroundCount
    checkGameState()
}

function findRandomNonMineCell() {
    var emptyCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isMine) {
                emptyCells.push({ i, j })
            }
        }
    }
    var idx = getRandomInt(0, emptyCells.length)
    return emptyCells[idx]
}

function onRightClick(elCell, rowIdx, colIdx) {
    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown || !gGame.isOn) return

    gGame.markedCount++

    currCell.isMarked = !currCell.isMarked
    elCell.innerText = currCell.isMarked ? MARKED : ''

    checkGameState()
}

function checkGameState(isMine = false) {
    if (isMine) {
        console.log('you lost')
        revealMines()
        gGame.isOn = false
    }
    var mines = (gLevel.size ** 2) - gLevel.mines
    if (gGame.markedCount === gLevel.mines && gGame.shownCount === mines) {
        gGame.isOn = false
        console.log('you won')
    }
}

function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) {
                var selector = getCellSelector(i, j)
                var currElCell = document.querySelector(selector)
                currElCell.innerText = MINE
            }
        }
    }
}

function getCellSelector(i, j) {
    return `.cell-${i}-${j}`
}

function setDifficulty(elBtn) {
    var difficuly = elBtn.innerText

    switch (difficuly) {
        case 'Easy':
            gLevel.size = 4
            gLevel.mines = 2
            break;
        case 'Medium':
            gLevel.size = 8
            gLevel.mines = 14
            break;
        case 'Hard':
            gLevel.size = 12
            gLevel.mines = 32
            break;
    }
    onInit()
}