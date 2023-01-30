require: slotfilling/slotFilling.sc
  module = sys.zb-common
  
require: text/text.sc
    module = zenbot-common
    
require: where/where.sc
    module = zenbot-common

require: common.js
    module = zenbot-common

require: hangmanGameData.csv
    name = HangmanGameData
    var = $HangmanGameData
    
require: functionsWord.js

patterns:
    $Word = $entity<HangmanGameData> || converter = function ($parseTree) {
        var id = $parseTree.HangmanGameData[0].value;
        return $HangmanGameData[id].value;
        };

theme: /

    state: Правила || modal = true
        q!: $regex</start>
        intent!: /ДавайИграть
        a: Привет! Давай сыграем в игру "Виселица". Я загадываю слово на русском языке, а тебе нужно его отгадать.
        a: После введения первой буквы можешь попытаться угадать слово целиком. Если знаешь ответ, напиши "угадать" или само слово в чат
        a: У тебя 6 попыток. Я предупрежу, когда останется 2
        a: Будешь играть? 
        go!: /Правила/Согласен?

        state: Согласен?
            state: Да
            #отгадывать слово полностью можно только после ввода первой буквы, потому что это подтверждает согласие на игру
                intent: /Согласие
                a: Начинаем игру!
                go!: /ЗагадываниеСлова

            state: Нет
                intent: /Несогласие
                a: Ну и ладно! Если передумаешь — скажи "давай поиграем"
                
            state: LocalCatchAll
                event: noMatch
                a: Ты хочешь играть? Ответь "да" или "нет"
                
    state: ЗагадываниеСлова
        script:
            # выберем рандомное слово из словаря
            $session.keys = Object.keys($HangmanGameData);
            var chosenWord = $HangmanGameData[chooseRandWord($session.keys)].value.word
            # cохраняем нижние подчеркивания, чтобы потом их редактировать во время отгадывания букв
            var editedWord = letterCount(chosenWord)
            $reactions.answer(letterCount(chosenWord));
            $session.chosenWord = chosenWord
            $session.editedWord = editedWord
            # сохраняем количество оставшихся попыток
            var numberTries = 6
            $session.numberTries = numberTries
            $reactions.transition("/УгадатьБукву");
            
    state: УгадатьБукву
        # сохраняем введенную пользователем букву
        # у меня возникла проблема с буквой "ё", если ее добавить в словарь, то "е" не распознается
        intent: /Буква
        script:
            var letter = $parseTree._Letter;
            # проверяем есть ли буква в слове
            if (letterInWord(letter, $session.chosenWord) == true) {
                $reactions.answer("Такая буква есть");
            # если есть, то показываем угаданные буквы
                $session.editedWord = changeLetters(letter, $session.editedWord, $session.chosenWord)
                $reactions.answer($session.editedWord);
            # если нет, то списываем одну попытку
            } else {
                $reactions.answer("Такой буквы нет")
                $session.numberTries -= 1
            # проверяем сколько осталось попыток
                if (checkAttempts($session.numberTries) == true) {
                    $reactions.answer("Оставшееся количество попыток: {{$session.numberTries}}");
                } else {
                    if (checkFail($session.numberTries) == true) {
                        $reactions.answer("Попытки закончились. Загаданное слово было: {{$session.chosenWord}}. Хочешь еще раз?");
                        $reactions.transition("/Правила/Согласен?");
                    }
                }
            }
            
    state: ХочуУгадать
        intent!: /ПопыткаУгадать
        a: Хочешь попробовать угадать? Напиши предполагаемое слово
        go: /ОтгадываниеСлова
        
    state: ОтгадываниеСлова
        q: $Word
        script:
        # если слово распознано, то сравниваем с тем, что загадали
            if ($request.query.toLowerCase() == $session.chosenWord.toLowerCase()) {
                $reactions.answer("Ты выиграл! Хочешь еще раз?");
                $reactions.transition("/Правила/Согласен?");
            } else {
                $reactions.answer("Неправильное слово. Попробуй еще раз.")
                $session.numberTries -= 1
                if (checkAttempts($session.numberTries) == true) {
                    $reactions.answer("Оставшееся количество попыток: {{$session.numberTries}}");
                } else {
                    if (checkFail($session.numberTries) == true) {
                        $reactions.answer("Попытки закончились. Загаданное слово было: {{$session.chosenWord}}. Хочешь еще раз?");
                        $reactions.transition("/Правила/Согласен?");
                    }
                }
            }
            
        state: NoMatch
            event!: noMatch
            a: Я не знаю такое слово. Попробуй ввести другое
        
        
    state: NoMatch
        event!: noMatch
        a: Я не понял. Вы сказали: {{$request.query}}
        
    state: EndGame
        intent!: /endThisGame
        a: Очень жаль! Если передумаешь — скажи "давай поиграем"
