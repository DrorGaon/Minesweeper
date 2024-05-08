'use strict'


function clickOnMine(elCell) {

    gGame.livesRemaining--
    var elLivesRemaining = document.querySelector('.life-counter span')
    var str = LIFE.repeat(gGame.livesRemaining)
    str += X.repeat(3 - gGame.livesRemaining)
    elLivesRemaining.innerText = str
    if (gGame.livesRemaining === 0) {
        elCell.innerText = MINE
        elCell.classList.add('mine')
        clearTimeout(gMineTimeout)
        checkGameState(true)
    } else {
        clearTimeout(gMineTimeout)
        elCell.innerText = MINE
        elCell.classList.add('revealed', 'mine')
        gMineTimeout = setTimeout(() => {
            elCell.innerText = ''
            elCell.classList.remove('revealed', 'mine')
        }, 1000);
    }
}

function revealNegs(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            if (gBoard[i][j].isShown || gBoard[i][j].isMarked) continue
            gGame.shownCount++
            gBoard[i][j].isShown = true

            var currElCell = document.querySelector(getCellSelector(i, j))
            currElCell.innerText = gBoard[i][j].minesAroundCount
            currElCell.classList.add('revealed')
            if (currElCell.innerText === '0'){
                currElCell.innerText = ''
                revealNegs(i,j)
            } 
        }
    }
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
    clearInterval(gTimerInterval)
}

function findRandomNonMineCell() {
    var emptyCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isMine && !gBoard[i][j].isShown && !gBoard[i][j].isMarked ) {
                emptyCells.push({ i, j })
            }
        }
    }
    var idx = getRandomInt(0, emptyCells.length)
    return emptyCells[idx]
}

function getCellSelector(i, j) {
    return `.cell-${i}-${j}`
}

function hint(){
    if(gIsFirstClick || gGame.hintsRemaining === 0 || !gGame.isOn) return

    gGame.isHint = !gGame.isHint

    if(gGame.isHint) gGame.hintsRemaining--
    else gGame.hintsRemaining++

    var elHintsRemaining = document.querySelector('.hint-btn span')
    var str = HINT.repeat(gGame.hintsRemaining)
    str += X.repeat(3 - gGame.hintsRemaining)
    elHintsRemaining.innerText = str
}

function onHintClick(rowIdx, colIdx){
    gGame.isHint = !gGame.isHint
    gGame.isOn = false
    var hintCells = []
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue
            if (gBoard[i][j].isShown || gBoard[i][j].isMarked ) continue
            hintCells.push({i, j})
            var currElCell = document.querySelector(getCellSelector(i, j))
            currElCell.innerText = gBoard[i][j].isMine ? MINE : gBoard[i][j].minesAroundCount
        }
    }

    setTimeout(() => {
        for (var i = 0; i < hintCells.length; i++){
            var currElCell = document.querySelector(getCellSelector(hintCells[i].i, hintCells[i].j))
            currElCell.innerText = ''
        }
        gGame.isOn = true
    }, 750);
}

function safeClick(){
    if (gIsFirstClick || gGame.safeClicksRemaining === 0 || !gGame.isOn) return
    gGame.safeClicksRemaining--

    var elSafeCLicksRemaining = document.querySelector('.safe-click-btn span')
    var str = SAFE_CLICK.repeat(gGame.safeClicksRemaining)
    str += X.repeat(3 - gGame.safeClicksRemaining)
    elSafeCLicksRemaining.innerText = str


    var rndCell = findRandomNonMineCell()
    var elCell = document.querySelector(getCellSelector(rndCell.i, rndCell.j))
    elCell.classList.add('safe-cell')
    setTimeout(() => {
        elCell.classList.remove('safe-cell')
    }, 1000);
}

function timer(){
    gTimerInterval = setInterval(() => {
        var elTimer = document.querySelector('.timer span')
        elTimer.innerText = +elTimer.innerText + 1 
    }, 1000);
}

function undo(){
    if (gPrevMoves.length === 1 || !gGame.isOn || gPrevGameStates.length === 1 || gIsFirstClick) return

    gBoard = gPrevMoves[gPrevMoves.length - 1]
    gPrevMoves.pop()

    gGame = gPrevGameStates[gPrevGameStates.length - 1]
    gPrevGameStates.pop()

    renderBoard()
    renderHUD(false)
    reColorCells()

}

function renderHUD(isRestart){
    
    if(isRestart){
        var btns = document.querySelectorAll('.hint-btn, .safe-click-btn, .undo-btn')
        for(var i = 0; i < btns.length; i++){
            btns[i].style.opacity = '50%'
        }
        var elTimer = document.querySelector('.timer span')
        elTimer.innerText = 0 
    
        gGame.livesRemaining = gGame.hintsRemaining = gGame.safeClicksRemaining = 3
    }

    var elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = SMILEY

    document.querySelector('.life-counter span').innerText = LIFE.repeat(gGame.livesRemaining) + X.repeat(3 - gGame.livesRemaining)
    document.querySelector('.hint-btn span').innerText = HINT.repeat(gGame.hintsRemaining) + X.repeat(3 - gGame.hintsRemaining)
    document.querySelector('.safe-click-btn span').innerText = SAFE_CLICK.repeat(gGame.safeClicksRemaining) + X.repeat(3 - gGame.safeClicksRemaining)
}

function updateHistory(){
    gPrevMoves.push(structuredClone(gBoard))
    gPrevGameStates.push(structuredClone(gGame))
}

function reColorCells(){
    for(var i = 0; i < gBoard.length; i++){
        for (var j = 0; j < gBoard[i].length; j++){
            if(!gBoard[i][j].isMine){
                document.querySelector(getCellSelector(i,j)).style.color = NUM_COLORS[gBoard[i][j].minesAroundCount]
            }
        }
    }
}

function storeScore(isRestart){
    var score = document.querySelector('.timer span').innerText
    switch (gLevel.size) {
        case 4:
            console.log(score)
            if (!localStorage.topEasyScore) {
                document.querySelector('.best-easy-score').innerText = 'No time yet'  
            }
            if(score < +localStorage.topEasyScore) {
                console.log('test')
                localStorage.topEasyScore = score
                document.querySelector('.best-easy-score').innerText = localStorage.topEasyScore
            } 
            break;
        case 8:
            if (!localStorage.topMediumScore) {
                document.querySelector('.best-medium-score').innerText = 'No time yet'  
            }
            else if(score < +localStorage.topMediumScore) {
                localStorage.topMediumScore = score
                document.querySelector('.best-medium-score').innerText = localStorage.topMediumScore
            } 
            break;
        case 12:
            if (!localStorage.topHardScore) {
                document.querySelector('.best-hard-score').innerText = 'No time yet'  
            }
            else if(score < +localStorage.topHardScore) {
                localStorage.topHardScore = score
                document.querySelector('.best-hard-score').innerText = localStorage.topHardScore
            } 
            break;
    }
}

