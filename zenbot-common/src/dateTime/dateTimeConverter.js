$global.$converters = $global.$converters || {};
var cnv = $global.$converters;


// **********************************************************
//                  DATE&TIME CONVERTERS
// **********************************************************
(function() {
cnv.composeConverter = function(parseTree) {
    var values = cnv.collectParseTreeValues(parseTree);
    var ret = _.reduce(values, function(o1, o2) {
        return _.extend(o1, o2);
    });

    if (parseTree.TimeHoursModifier) {
        ret.hour = addTimeModifier(ret.hour, parseTree.TimeHoursModifier[0].value);
        ret.period = parseTree.TimeHoursModifier[0].value;
    }

    return ret;
};

cnv.composeTimeDateHoursModifierConverter = function(parseTree) {
    var values = cnv.collectParseTreeValues(parseTree);
    var ret = _.reduce(values, function(o1, o2) {
        return _.extend(o1, o2);
    });

    if (parseTree.TimeHoursModifier) {
        ret.hour = addTimeModifier(ret.hour, parseTree.TimeHoursModifier[0].value);
        ret.period = parseTree.TimeHoursModifier[0].value;
    }

    return ret;
};

cnv.timeHoursConverter = function(parseTree) {
    if (parseTree.TimeHoursSpecial) {
        return parseInt(parseTree.TimeHoursSpecial[0].value);
    }

    var ret = {
        hour: parseTree.Number[0].value
    };
    if (parseTree.TimeHoursModifier) {
        ret.hour = addTimeModifier(ret.hour, parseTree.TimeHoursModifier[0].value);
        ret.period = parseTree.TimeHoursModifier[0].value;
    }
    return ret;
};

function addTimeModifier(hour, modifier) {
    if (hour == 12) {
        if (modifier == "am") {
            return 0;
        }
        if (modifier == "pm") {
            return 12;
        }
    }
    if (hour > 12 && modifier == "pm") {
        return hour;
    }
    return hour + (modifier == "am" ? 0 : 12);
}

cnv.timeRelativeHoursConverter = function(parseTree) {
    var ret = {
        hours: parseTree.Number[0].value,
        minutes: 30
    };
    return ret;
};

cnv.timeRelativeMinutesConverter = function(parseTree) {
    var ret = {
        minutes: parseTree.Number[0].value,
        seconds: 30
    };
    return ret;
};

cnv.absoluteTimeConverter = function(parseTree) {
    var time = {};
    if (parseTree.Time) {
        time = parseTree.Time[0].value;
    } else if ( parseTree.TimeRelative ) {
        time = cnv.propagateConverter(parseTree);
    } else {
        time.hour = safeValue(parseTree.TimeHoursNumeric);
        if (typeof time.hour === 'object' ) {
            time.period = time.hour.period;
            time.hour = time.hour.hour;
        }

        if (time.hour >= 100 && time.hour < 2400 && !parseTree.TimeMinutesNumeric) {
            time.minute = time.hour % 100;
            time.hour = Math.floor(time.hour / 100);
        } else {
            time.minute = safeValue(parseTree.TimeMinutesNumeric);
        }
    }

    if (parseTree.TimeMinutesModifier) {
        time.hour -= 1;
        time.minute = 60 - parseTree.TimeMinutesModifier[0].value;
    }

    if (parseTree.TimeMinutesAndHours) {
        time.hour -= 1;
        time.minute = parseTree.TimeMinutesAndHours[0].value;
    }

    if (parseTree.TimeAddMinutesModifier) {
        time.minute = parseTree.TimeAddMinutesModifier[0].value;
    }

    if (parseTree.TimeHoursModifier) {
        time.hour = addTimeModifier(time.hour, parseTree.TimeHoursModifier[0].value);
        var period = parseTree.TimeHoursModifier[0].value;
        if (time.hour > 12 && period == "am")
            period = "pm";
        time.period = period;
    }

    if (parseTree.TimeSecondsNumeric) {
        time.seconds = parseTree.TimeSecondsNumeric[0].value;
    }
    return time;
};

cnv.timeAbsoluteEnConverter = function(parseTree) {
    var parts = parseTree.text.split("-");
    var hours = parts[0];
    var minutes = parts[1];

    var time = {
        hour : parseInt(convertUnits(hours)),
        minute : parseInt(convertDozens(minutes))
    };

    return time;
};

cnv.absoluteDateConverter = function(parseTree) {
    var date = {};
    date.day = safeValue(parseTree.DateDayNumeric);
    date.month = safeValue(parseTree.DateMonth);
    date.year = safeValue(parseTree.DateYearNumeric);
    date.weekDay = safeValue(parseTree.DateWeekday);
    date.weekDayOrder = safeValue(parseTree.WeekDayOrder);
    date.years = safeValue(parseTree.DateRelativeYear);
    date.months = safeValue(parseTree.DateRelativeMonth);

    if(parseTree.DateWeekdayOrder){
        date = parseTree.DateWeekdayOrder[0].value;
    }

    if (parseTree.DateRelative) {
        date = parseTree.DateRelative[0].value;
        if (parseTree.DateWeekday) {
            date.weekDay = parseTree.DateWeekday[0].value;
        }
    }

    if (parseTree.Date) {
        date = parseTree.Date[0].value;
    }

    if (parseTree.DateHoliday) {
        switch(parseTree.DateHoliday[0].value) {
            case "1":
                date = {
                    "day": 25,
                    "month": 12
                };
                break;
            case "2":
                date = {
                    "day": 1,
                    "month": 1
                };
                break;
            case "3":
                date = {
                    "day": 31,
                    "month": 10
                };
                break;
            case "4":
                date = {
                    "day": 4,
                    "month": 7
                };
                break;
            case "5":
                date = {
                    "day": 14,
                    "month": 2
                };
                break;
            case "6":
                date = {
                    "day": 17,
                    "month": 3
                };
                break;
            case "7":
                //calculate the last Thursday of November
                var weekday = 4;
                var order = 4;
                var month = 11;
                break;
            case "8":
                //calculate the 2nd Sunday of May
                var weekday = 7;
                var order = 2;
                var month = 5;
                break;
            case "9":
                //calculate the 3rd Sunday of June
                var weekday = 7;
                var order = 3;
                var month = 6;
                break;
            case "10":
                //calculate the 1st Sunday of February
                var weekday = 7;
                var order = 1;
                var month = 2;
                break;
        }

        if (parseTree.DateHoliday[0].value >=7) {
            if (typeof parseTree.DateYearNumber != 'undefined') {
                year = parseTree.DateYearNumber[0].value;
            } else if (typeof parseTree.DateRelativeYear != 'undefined') {
                year = currentDate().add(parseTree.DateRelativeYear[0].value, 'years').year();
            } else {
                year = currentDate().year();
            }

            date = calculateDateWeekdayOrder(year, month, weekday, order);
            if (typeof parseTree.DateYearNumber == 'undefined' && typeof parseTree.DateRelativeYear == 'undefined') {
                date.calculated = {
                    year: year,
                    month: month,
                    weekday: weekday,
                    order: order
                };
            }
        }
    }

    if (parseTree.DateWeekdayOrder) {
        date = parseTree.DateWeekdayOrder[0].value;
    }

    return date;
};

cnv.timeConverterHhMmSs = function(parseTree) {
    var parts = parseTree.text.split(/:|\.|-/);
    var time = {
        hour : parseInt(parts[0].trim()),
        minute : parseInt(parts[1].trim())
    };
    if (parts.length == 3) {
        time.second = parseInt(parts[2]);
    }
    return time;
};

cnv.timeConverterHhMm = function(parseTree) {
    var time = {
        hour : parseInt(parseTree.TimeHourNumber[0].text),
        minute : parseInt(parseTree.TimeMinuteNumber[0].text)
    };
    return time;
};

cnv.timeConverterHhMmWithoutSeparator = function(parseTree) {
    var time = {
        hour : parseInt(parseTree.text.substr(0, parseTree.text.length - 2)),
        minute : parseInt(parseTree.text.substr(parseTree.text.length - 2, parseTree.text.length))
    };
    return time;
};

cnv.weekDayConverter = function(parseTree) {
    var week = {
        weekDay : parseInt(parseTree.DateWeekday[0].value)
    };
    return week;
};

cnv.dateWeekdayOrderConverter = function(parseTree) {
    var year, month, weekday, order, date, calculatedDate;

    if (typeof parseTree.DateYearNumber != 'undefined') {
        year = parseTree.DateYearNumber[0].value;
    } else if (typeof parseTree.DateRelativeYear != 'undefined') {
        year = currentDate().add(parseTree.DateRelativeYear[0].value, 'years').year();
    } else {
        year = currentDate().year();
    }

    month = parseTree.DateMonth[0].value;
    weekday = parseTree.DateWeekday[0].value;
    order = parseTree.Number[0].value;
    calculatedDate = calculateDateWeekdayOrder(year,month,weekday,order);
    date = calculatedDate;
    if (typeof parseTree.DateYearNumber == 'undefined' && typeof parseTree.DateRelativeYear == 'undefined') {
        date.calculated = {
            year: year,
            month: month,
            weekday: weekday,
            order: order
        };
    }
    return date;
};

cnv.dateAbsoleteEnConverter = function(parseTree) {
    var parts = parseTree.text.split("-");
    var year = parts[0];
    var month = parts[1];
    var day = parts[2];

    var date = {
        year : parseInt(year),
        month : parseInt(month),
        day : parseInt(day)
    };

    return date;
};

cnv.dateWithSlashesConverter = function(parseTree) {
    var parts = parseTree.text.split("/");
    var m = parseInt(parts[0]);
    var d = parseInt(parts[1]);
    var y;

    if (parts.length == 3) {
        y = parseInt(parts[2]);
    }

    var date = {
        year : (y >= 50) ? 1900 + y : 2000 + y,
        month : m,
        day : d
    };

    if (parseTree.DateWeekday) {
        date.weekDay = parseTree.DateWeekday[0].value;
    }

    return date;
};

cnv.dateWithDotsConverter = function(parseTree) {
    var parts = parseTree.text.split(".");
    var d = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    var y;
    if (parts.length == 3) {
        y = parseInt(parts[2]);
    }
    var date = {
        year : (y >= 50) ? 1900 + y : 2000 + y,
        month : m,
        day : d
    };
    return date;
};

cnv.yearWithSpaceConverter = function(parseTree) {
    var parts = parseTree.text.split(" ");
    return parseInt(parts[0] + parts[1]);
};

cnv.relativeDateTimeConverter = function(parseTree) {
    var interval = {};
    interval.years = safeValue(parseTree.DateTimeRelativeYears);
    interval.months = safeValue(parseTree.DateTimeRelativeMothes);
    interval.days = safeValue(parseTree.DateTimeRelativeDays);
    interval.weekDays = safeValue(parseTree.DateTimeRelativeWeekDays);
    interval.hours = safeValue(parseTree.TimeRelativeHours);
    interval.minutes = safeValue(parseTree.TimeRelativeMinutes);
    interval.seconds = safeValue(parseTree.TimeRelativeSeconds);

    if (parseTree.TimeRelativeHoursHalf || parseTree.TimeRelativeMinutesHalf) {
        interval = cnv.propagateConverter(parseTree);
    }

    return interval;
};

function multiplySafe(val, mul) {
    if (typeof val !== 'undefined') {
        return val * mul;
    }
    return undefined;
}

cnv.relativeDateTimeMultiplierConverter = function(parseTree) {
    var mul = parseTree.value;
    var val = parseTree.DateTimeSimpleInterval[0].value;
    var interval = {};
    interval.years = multiplySafe(val.years, mul);
    interval.months = multiplySafe(val.months, mul);
    interval.days = multiplySafe(val.days, mul);
    interval.weekDays = multiplySafe(val.weekDays, mul);
    interval.hours = multiplySafe(val.hours, mul);
    interval.minutes = multiplySafe(val.minutes, mul);
    interval.seconds = multiplySafe(val.seconds, mul);
    return interval;
};

cnv.relativeDayConverter = function(parseTree) {
    if (parseTree.DateWeekday) {
        var currentDay = currentDate().day();
        if (currentDay == 0) {
            currentDay = 7;
        }
        var desired = parseTree.DateWeekday[0].value;
        var diff = desired - currentDay;

        if (diff >= 0 && parseTree.DateFuturePastModifier && (parseTree.DateFuturePastModifier[0].text == 'next'||parseTree.DateFuturePastModifier[0].text.substring(0,4) == 'след')){
            diff += 7;
        }
        if (diff < 0) {
            diff += 7;
        }
        if (parseTree.DateFuturePastModifier && (parseTree.DateFuturePastModifier[0].text.substring(0,4) != 'след' && parseTree.DateFuturePastModifier[0].text != 'next')) {
            var num = parseTree.DateFuturePastModifier[0].value;
            diff = 7*num + diff;
        }
        if (parseTree.DateFuturePastModifier && checkWord(parseTree, "last") && (desired < currentDay || (desired == 7 && (currentDay-desired) <= -3)) && currentDay != 7 && (currentDay-desired) <=3){
            diff -= 7;
        }
        return diff;
    } else {
        return cnv.numberConverterMultiply(parseTree);
    }
};

cnv.relativeMonthConverter = function(parseTree) {
    return cnv.numberConverterMultiply(parseTree);
};

cnv.timeHalfAnHourConverter = function(parseTree) {
    return {
        hour: parseInt(parseTree.value) - 1,
        minute: 30
    }
};

cnv.relativeDateConverter = function(parseTree) {
    return {
        years: safeValue(parseTree.DateRelativeYear),
        months: safeValue(parseTree.DateRelativeMonth),
        days: safeValue(parseTree.DateRelativeDay)
    };
};

cnv.specialDateTimeConverter = function(parseTree) {
    var time = parseTree.TimeAbsolute[0].value;
    time.day = parseTree.Day[0].value;
    return time;
};

cnv.specialDateTimeEnConverter = function(parseTree) {
    switch(parseTree.value) {
        case "1":
            return {
                days : 0,
                hour : 18
            };
    }

    log("Unexpected text: " + parseTree.text);
};

/*Convertor for time&period without separator like "7am" or "900pm" */
cnv.timeConverterWithPeriod = function(parseTree) {
    if (parseTree.text.length>4)
    {
        var time = {
            hour :  parseInt(parseTree.text.substr(0, parseTree.text.length - 4).trim()),
            minute: parseInt(parseTree.text.substr(parseTree.text.length - 4, parseTree.text.length).trim()),
            period : parseTree.text.substr(parseTree.text.length - 2, parseTree.text.length)
        };
    }
    else
    {
        var time = {
            hour :  parseInt(parseTree.text.substr(0, parseTree.text.length - 2)),
            period : parseTree.text.substr(parseTree.text.length - 2, parseTree.text.length)
        };
    }

    time.hour = addTimeModifier(time.hour, time.period);

    return time;
};

cnv.dateWeekdayOrderConverter = function(parseTree) {
    var year, month, weekday, order, date, calculatedDate;

    if (typeof parseTree.DateYearNumber != 'undefined') {
        year = parseTree.DateYearNumber[0].value;
    } else if (typeof parseTree.DateRelativeYear != 'undefined') {
        year = currentDate().add(parseTree.DateRelativeYear[0].value, 'years').year();
    } else {
        year = currentDate().year();
    }

    if (typeof parseTree.DateMonth != 'undefined'){
        month = parseTree.DateMonth[0].value;
    }
    else if (typeof parseTree.DateRelativeMonth != 'undefined'){
        month = currentDate().add(parseTree.DateRelativeMonth[0].value + 1, 'months').month();
    }


    weekday = parseTree.DateWeekday[0].value;
    order = parseTree.Number[0].value;
    calculatedDate = calculateDateWeekdayOrder(year,month,weekday,order);
    date = calculatedDate;
    if (typeof parseTree.DateYearNumber == 'undefined' && typeof parseTree.DateRelativeYear == 'undefined') {
        date.calculated = {
            year: year,
            month: month,
            weekday: weekday,
            order: order
        };
    }
    return date;
};

cnv.absoluteDateTimeConverter = function(value) {
    var m = currentDate();

    // apply relatives
    m.add(value.months, 'months');
    m.add(value.days, 'days');
    momentBusiness.addWeekDays(m, value.weekDays);
    m.add(value.years, 'years');
    m.add(value.hours, 'hours');
    m.add(value.minutes, 'minutes');
    m.add(value.seconds, 'seconds');

    // fill missing fields
    if (typeof value.year == 'undefined' || value.year == null) {
        value.year = m.year();
    } else {
        if (value.year < 100) {
            var dif = Math.abs((m.year() % 100) - value.year);
            if ((m.year() % 100) < 30 && dif > 30) {
                value.year = (Math.floor(m.year()/100)-1)*100 + value.year;
            } else if ((m.year() % 100) > 70 && dif > 70) {
                value.year = (Math.floor(m.year()/100)+1)*100 + value.year;
            } else {
                value.year = Math.floor(m.year()/100)*100 + value.year;
            }
        }

    }
    if (typeof value.month == 'undefined' || value.month == null) {
        value.month = m.month() + 1;
    }
    if (typeof value.day == 'undefined' || value.day == null) {
        value.day = m.date();
    }
    if (typeof value.hour == 'undefined' || value.hour == null) {
        value.hour = m.hour();
        if (typeof value.minute == 'undefined' || value.minute == null) {
            value.minute = m.minute();
            if (typeof value.second == 'undefined' || value.second == null) {
                value.second = m.second();
            }
        } else {
            if (typeof value.second == 'undefined' || value.second == null) {
                value.second = 0;
            }
        }
    } else {
        if (typeof value.minute == 'undefined' || value.minute == null) {
            value.minute = 0;
        }
        if (typeof value.second == 'undefined' || value.second == null) {
            value.second = 0;
        }
    }

    //check if valid date
    if (value.day > 31 ||
        value.day > 28 && value.month == 2 && value.year % 4 != 0 ||
        value.day > 29 && value.month == 2 && value.year % 4 == 0 ||
        value.day > 30 && (value.month == 4 || value.month == 6 ||  value.month == 9 || value.month == 11)){

        return "Invalid date";
    } else {
        return normalizeAbsoluteDateTime(value);
    }
};

cnv.normalizeDateTimeConverter = function(parseTree) {
    var value = cnv.propagateConverter(parseTree);
    return {
        years:  value.years,
        months: value.months,
        days:   value.days,
        weekDays: value.weekDays,
        hours:  value.hours,
        minutes:value.minutes,
        seconds:value.seconds,
        year:   value.year,
        month:  value.month,
        day:    value.day,
        weekDay:value.weekDay,
        hour:   value.hour,
        minute: value.minute,
        second: value.second,
        period: value.period
    };
};

function normalizeAbsoluteDateTime(value) {
    var $rd = $jsapi.context().request.data;
    var m;
    if (typeof $rd.offset == 'undefined') {
        $rd.offset = 0;
    } 
    m = moment(0).zone(-$rd.offset);
    m.add(value.month - m.month() - 1, 'months');
    m.add(value.day - m.date(), 'days');
    m.add(value.year - m.year(), 'years');
    m.add(value.hour - m.hour(), 'hours');
    m.add(value.minute - m.minute(), 'minutes');
    m.add(value.second - m.second(), 'seconds');
    return m;
}

function useOffset(m) {
    var $rd = $jsapi.context().request.data;
    if (typeof $rd.offset != 'undefined') {
        return moment(m + $rd.offset*($rd.offset < 1440 ? 60000 : 1));
    } else {
        return moment(m);
    }
}

function checkWord(parseTree, word){
    for (var i = 0; i < parseTree.words.length; i++){
        if (parseTree.words[i].toLowerCase() == word.toLowerCase()){
            return true;
        }
    }
    return false;
}

cnv.nowDateTimeConverter = function() {
    return {};
};

cnv.timeConverterDateMonth = function(parseTree) {
    var parts = parseTree.text.split("."||"/");
    var value = {
        day : parseInt(parts[0]),
        month : parseInt(parts[1]),
        year: parseInt(parts[2])
    };
    var m = moment(currentDate());
    m.add(value.month - m.month() - 1, 'months');
    m.add(value.day - m.date(), 'days');
    m.add(value.years, 'years');
    if (typeof value.year == 'undefined') {
        m.year = m.year();
    }
    return m;
}

})();