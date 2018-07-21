$(function(){
    $(".start").click(function(){
        game.start()
        $(this).addClass('d-none')
    });
    $('.answers').on("mouseenter", ".answerOption", function() {
        if (game.answerSelected === false){
            $(this).addClass('bg-secondary text-light')
        }
    });
    
    $('.answers').on("mouseleave", ".answerOption", function() {
        // hover ends code here
        if (game.answerSelected === false){
            $(this).removeClass('bg-secondary text-light')
        }
    });
    $(".answers").on('click','.answerOption',function(){
        if (game.answerSelected === false){
            if(game.isThereTime ===false){
                return
            }
            game.answerSelected=true;
            $(this).addClass('bg-warning')
            player.selection = $(this).children().first().html()
            game.suspense()
            setTimeout(function(){
                game.result()
            },3000)
            setTimeout(function(){
                game.getQuestion()
                game.answerSelected = false
            },5000)
        }
    });
    $(".answers").on('click','.restart',function(){
        player.score = 0
        game.questionNumber=0
        game.clear()
        game.getQuestion()
    });
    $(".playerHighScore").text(player.highscore)
    $(".settings").click(function(){
        $(".settingsModal").modal('toggle')
    });
});
var settings = {
    initTime : 10,
    initTimeCheck:function(){
        var timeInit = $("#timeInput").val()
        if (timeInit ===undefined || timeInit ==0 || timeInit ==""){
            settings.initTime = 10
            return
        }
        settings.initTime=timeInit
    },
    qCount:10,
    qCountCheck:function(){
        var qCount = $("#qCountInput").val()
        if (qCount ===undefined || qCount ==0 || qCount ==""){
            settings.qCount = 10
            return
        }
        settings.qCount=qCount
    },
    category:function(){
        var cat = $("#categorySelect option:selected").val()
        if (cat ===undefined || cat == 0){
            return null
        }
        parameters.category = cat
        return cat
    },
    difficulty:function(){
        var diff = $("#difficultySelect option:selected").val()
        if(diff===undefined||diff==0){
            return null
        }
        parameters.difficulty = diff
        return diff
    },
    type:function(){
        var type = $("#typeSelect option:selected").val()
        if(type===undefined||type==0){
            return null
        }
        parameters.type = type
        return type
    }
}
var parameters={
    amount:1,
    category:settings.category(),
    difficulty:settings.difficulty(),
    type:settings.type()
}
var game = {
    url:function(){
        var url = "https://opentdb.com/api.php";
        url+= '?' +$.param(parameters);
        return url
    },
    start:function(){
        game.getQuestion()
        $('h4').show()
    },
    settingsCheck:function(){
        settings.category()
        settings.difficulty()
        settings.type()
        settings.qCountCheck()
        settings.initTimeCheck()
        game.timeLeft = settings.initTime
        player.highscore = localStorage.getItem("highscore-"+settings.qCount)||"0/"+settings.qCount
    },
    getTestQuestion:function(){
        game.isThereTime=true
        if (game.questionNumber >= settings.qCount){
            game.end()
            return
        }
        game.settingsCheck()
        game.counter()
        game.clear()
        game.round = new Question({
            results:[{
                question:"bok",
                incorrect_answers:["birsey","baskaBirsey","birsey &amp; ben"],
                correct_answer:"Bir &amp;sey",
                type:"true/false",
                category:"test",
                difficulty:"hardest"
            }]
        })
        game.displayQuestion()
        game.displayAnswers()
        game.questionNumber+=1
        game.displayData()
        
    },
    testing:false,
    getQuestion:function(){
        if (game.testing ==true){
            this.getTestQuestion()
            return
        }
        game.isThereTime=true
        if (game.questionNumber >= settings.qCount){
            game.end()
            return
        }
        game.settingsCheck()
        $.ajax({
            url:game.url(),
            method:'GET'
        }).then(function(response){
            game.counter()
            game.clear()
            game.round = new Question(response)
            game.displayQuestion()
            game.displayAnswers()
            game.questionNumber+=1
            game.displayData()
        })
    },
    displayQuestion: function(){
        var card = $("<div>").addClass("card shadow-lg p-3 m-4 text-center rounded qCard")
        var qTitle = $("<h5>").html(game.round.question)
        card.append(qTitle)
        $(".answers").append(card)
        $(".answers").removeClass('d-none')
        var prog = $("<div class = 'progress'>")
        prog.css({'height':'3px'})
        var bar = $("<div class='progress-bar bg-warning'>").attr('role','progressbar')
        bar.attr('aria-valuenow',"0")
        bar.attr('aria-valuemin','0')
        bar.attr('aria-valuemax','100')
        bar.css({'width':'100%'})
        prog.append(bar)
        $(".description").append(prog)
    },
    displayAnswers:function(){
        var randOptions = randomizeAnswers(game.round.correct,game.round.incorrect)
        for (var i in randOptions){
            var card = $("<div>").addClass("card shadow-sm my-1 mx-auto text-center rounded w-25 answerOption float-left")
            var answer = $("<p class = 'my-auto'>").html(randOptions[i])
            card.attr("data",randOptions[i])
            card.append(answer)
            $(".qCard").append(card)
        }
    },
    answerSelected:false,
    timeLeft:settings.initTime,
    counter: function(){
        game.displayCounter() //making sure that counter is displayed before or with the question.
        var timer = setInterval(()=>{
            if ($("body").hasClass("modal-open")){
                return
            }
            if (game.timeLeft === 0){
                clearInterval(timer)
                game.timeOut()
                game.timeLeft = settings.initTime
                return
            }
            if(game.answerSelected === true){
                clearInterval(timer)
                game.timeLeft = settings.initTime
                return
            }
            game.displayCounter()
            game.timeLeft -= 1
        },1000)
    },
    isThereTime:true,
    timeOut:function(){
        if(game.answerSelected===true){return}
        game.isThereTime=false
        $(".progress-bar").css({'width':'0%'})
        player.wrong();
        $(".description").children().first().hide()
        $(".description").children().first().text("Ran out of time!")
        $(".description").children().first().fadeIn()   
        setTimeout(game.getQuestion,3000)
    },
    displayCounter: function(){
        $('.description').children().first().text(game.timeLeft)
        $(".progress-bar").css({
            'width':String((game.timeLeft/settings.initTime)*100)+"%"
        })
    },
    clear: function(){
        $(".answers").empty()
        $(".progress").remove()
    },
    result: function(){
        if(player.selection === game.round.correct){
            $(".description").children().first().hide()
            $(".description").children().first().text("Correct!")
            $(".description").children().first().fadeIn()
            player.correct()
        }else{
            $(".description").children().first().hide()
            $(".description").children().first().text("Wrong!")
            $(".description").children().first().fadeIn()
            player.wrong()
        }
    },
    suspense: function(){
        $(".description").children().first().hide()
        $(".description").children().first().text("Let's see if your answer is correct...")
        $(".description").children().first().fadeIn()   
    },
    questionNumber:0,
    displayData:function(){
        $(".questionCount").text(game.questionNumber+"/"+settings.qCount);
        $(".playerScore").text(player.score);
        $(".playerHighScore").text(player.highscore)
    },
    end: function(){
        $("h4").hide()
        player.highscore = localStorage.getItem("highscore-"+game.questionNumber)||"0/"+game.questionNumber
        var highscoreMagnitude = Number(player.highscore.split('/')[0])/Number(player.highscore.split('/')[1])
        if(player.score/game.questionNumber>highscoreMagnitude||isNaN(highscoreMagnitude)){
            player.highscore=player.score+"/"+game.questionNumber
        }
        localStorage.setItem("highscore-"+game.questionNumber,player.highscore)
        game.clear();
        game.displayData()
        var title = $("<h3 class='text-center'>").html("You have answered "+game.questionNumber+" questions!<br>Your score for this round is: <p>"+player.score+"/"+game.questionNumber+"</p>")
        var btn = $("<button class = 'btn-outline-success restart mx-auto'>").text("Play Again")
        $(".answers").append(title);
        $(".answers").append(btn)
    }
}
var player = {
    wrong:function(){
        var selectedCard = findAnswerCard(player.selection||" ")
        var correctAnswerCard = findAnswerCard(game.round.correct)
        if(selectedCard != undefined){selectedCard.addClass('bg-danger')}
        $(".progress-bar").removeClass("bg-warning")
        $(".progress-bar").addClass("bg-danger")
        correctAnswerCard.addClass('bg-success text-light')
    },
    correct:function(){
        player.score+=1
        var correctAnswerCard = findAnswerCard(game.round.correct)
        correctAnswerCard.removeClass("bg-warning")
        correctAnswerCard.addClass('bg-success text-light')
        $(".progress-bar").removeClass("bg-warning")
        $(".progress-bar").addClass("bg-success")
    },
    score:0,
    highscore:localStorage.getItem("highscore-"+settings.qCount)||"0/"+settings.qCount
}
function Question(response){
    this.question=response.results[0].question
    this.incorrect=response.results[0].incorrect_answers
    this.correct=response.results[0].correct_answer
    this.type= response.results[0].type
    this.category = response.results[0].category
    this.difficulty = response.results[0].difficulty
}
function findAnswerCard(text){
    //replace special character ' 
    // var ind = text.indexOf("&#039;")
    // if (ind > -1){
    //     text = text.slice(0,ind)+"'"+text.slice(ind+6)
    // }

    var answers = $(".answers").children().first().children()
    for (var i=1 ; i<answers.length;i++){
        var card = answers[i]
        if (card.getAttribute("data") === text){
            return $(card) //returning as a jquery element
        }
    }
}
function randomizeAnswers(correct,incorrects){
    var list = [];
    incorrects.push(correct);
    for (var i =0 ; i<incorrects.length;i++){
        var randIndex = Math.floor(Math.random()*(list.length+1));
        list.splice(randIndex,0,incorrects[i]);
    }
    return list
}