'use strict'

const MARKED = '🚩'
const MINE = '💣'
const SMILEY = '😀'
const DEAD_SMILY = '😵'
const WINNER_SMILEY = '😎'
const LIFE = '❤️'
const X = '❌'
const HINT = '🔎'
const SAFE_CLICK = '✔️'
const TIMER = '⏱️'
const NUM_COLORS = ['none', 'blue', 'green', 'red', 'darkblue', 'darkred', 'darkcyan', 'black', 'yellow']

var gBoard
var gIsFirstClick
var gMineTimeout
var gTimerInterval
var gPrevMoves = []
var gPrevGameStates = []

localStorage.mode = 'light'
// localStorage.topEasyScore = ''

var gLevel = {
    size: 8,
    mines: 14,
}

var gGame = {
    isOn: false,

    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    livesRemaining: 3,
    hintsRemaining: 3,
    isHint: false,
    safeClicksRemaining: 3,
    exterminatesRemaining: 1,
    megaHintsRemaining: 1,
    megaHintFirstClick: undefined,
    megaHintSecondClick: undefined,
    isMegaHint: false,
}

function onInit() {

    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gIsFirstClick = true
    gGame.livesRemaining = gGame.hintsRemaining = gGame.safeClicksRemaining = 3
    gGame.exterminatesRemaining = gGame.megaHintsRemaining = 1
    gGame.isHint = gGame.isMegaHint = false


    storeScore(true)
    renderHUD(true)
    createBoard()
    renderBoard()
    setMinesNegsCount()
    reColorCells()

    clearInterval(gTimerInterval)

    gPrevMoves = []
    gPrevGameStates = []

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
    for (var i = 0; i < gLevel.mines; i++) {
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
            var img 
            var cellClass = ''
            var currCell = gBoard[i][j]
            if (currCell.isMarked) img = MARKED
            else if (!currCell.isShown) img = ''
            else if (currCell.isShown){
                img = currCell.minesAroundCount
                if (img === 0) img = ''
                cellClass = 'revealed'
            }
            strHtml += `<td class="cell-${i}-${j} ${cellClass}"
            onclick="onCellClicked(this, ${i}, ${j})"
            oncontextmenu="onRightClick(this, ${i}, ${j})"
            >${img}</td>`
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
            document.querySelector(getCellSelector(i,j)).style.color = NUM_COLORS[minesAround]
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
    if (gIsFirstClick) {
        onFirstClick(rowIdx, colIdx)
    }

    var currCell = gBoard[rowIdx][colIdx]

    if (gGame.isHint && !currCell.isShown) {
        onHintClick(rowIdx, colIdx)
        return
    }
    
    if(gGame.isMegaHint){
        onMegaHintClick(rowIdx, colIdx)
        return
    }

    if (currCell.isMarked || !gGame.isOn || currCell.isShown) return

    if(currCell.isMine){
        clickOnMine(elCell)
        return
    }

    updateHistory()

    currCell.isShown = true
    gGame.shownCount++

    elCell.innerText = currCell.minesAroundCount
    if (elCell.innerText === '0') {
        elCell.innerText = ''
        revealNegs(rowIdx, colIdx)
    } 
    elCell.classList.add('revealed')
    
    checkGameState()
}

function onRightClick(elCell, rowIdx, colIdx) {
    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown || !gGame.isOn || gIsFirstClick) return

    updateHistory()

    if (currCell.isMarked) gGame.markedCount-- 
    else gGame.markedCount++

    var elMineCounter = document.querySelector('.mine-counter span')
    elMineCounter.innerText = gLevel.mines - gGame.markedCount

    currCell.isMarked = !currCell.isMarked

    elCell.innerText = currCell.isMarked ? MARKED : ''

    checkGameState()
}

function checkGameState(isMine = false) {
    
    if (isMine) {
        if(gGame.livesRemaining === 0){
            var elSmiley = document.querySelector('.smiley')
            elSmiley.innerText = DEAD_SMILY
            revealMines()
            gGame.isOn = false
            clearInterval(gTimerInterval)
            var btns = document.querySelectorAll('.power-btn')
            for(var i = 0; i < btns.length; i++){
                btns[i].style.opacity = '50%'
            }        
        }
    }

    var nonMineCells = (gLevel.size ** 2) - gLevel.mines
    if (gGame.markedCount === gLevel.mines && gGame.shownCount === nonMineCells) {
        gGame.isOn = false
        var elSmiley = document.querySelector('.smiley')
        elSmiley.innerText = WINNER_SMILEY
        clearInterval(gTimerInterval)
        var btns = document.querySelectorAll('.power-btn')
        for(var i = 0; i < btns.length; i++){
            btns[i].style.opacity = '50%'
        }
        storeScore(false) 
    }
}

function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
                var selector = getCellSelector(i, j)
                var currElCell = document.querySelector(selector)
                currElCell.innerText = MINE
            }
        }
    }
}

function onFirstClick(rowIdx, colIdx) {
    var clickAndNegs = []
    var counter = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue
            if (gBoard[i][j].isMine) counter++
            else gBoard[i][j].isMine = true // making sure that findRandomNonMineCell doesn't pick this cell
            clickAndNegs.push(gBoard[i][j])
        }
    }

    for (var i = 0; i < counter; i++){
        var currCell = findRandomNonMineCell()
        gBoard[currCell.i][currCell.j].isMine = true
    }

    for (var i = 0; i < clickAndNegs.length; i++){
        clickAndNegs[i].isMine = false // reverting all the cells around the first click to non mines
    }

    setMinesNegsCount()
    gIsFirstClick = false

    var btns = document.querySelectorAll('.power-btn')
    for(var i = 0; i < btns.length; i++){
        btns[i].style.opacity = '100%'
    }
    timer()
}
