function chooseRandWord(keys) {
    // поиск случайного слова
    var i = 0
    keys.forEach(function(elem) {
        i++
    })
    return  $jsapi.random(i);
}

function letterCount(word) {
    // подсчет букв в слове и вывод нужного количества подчеркиваний   
    var i = 0
    var underscores = ""
    while (i < word.length) {
        underscores += "_ ";
        i+=1;
    } 
    return  underscores
}

function letterInWord(letter, word) {
    // проверка на то, есть ли буква в слове
    var response = false
    for (var i = 0; i < word.length; i += 1) {
       if (word[i] == letter.value) {
            response = true
        }
    }
    return response
}

String.prototype.replaceAt = function(index, replacement) {
    // Взяла со stackoverflow для функции под этой, иначе не могла изменить строку
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

function changeLetters(letter, editedWord, initialWord) {
    // замена подчеркиваний на угаданные буквы   
    for (var i = 0; i < initialWord.length; i += 1) {
       if (initialWord[i] == letter.value) {
            var editedWord = editedWord.replaceAt(i*2, letter.value)
        } 
    }
    return editedWord
}

function checkAttempts(numberAttempts) {
    // проверка для предупреждений, когда остается 1 или 2 попытки    
    var response = false
    if (numberAttempts == 2 || numberAttempts == 1) {
        response = true
        return response
    }
}

function checkFail(numberAttempts) {
    // проверка на проигрыш
    var response = false
    if (numberAttempts == 0) {
        response = true
        return response
    }
}
