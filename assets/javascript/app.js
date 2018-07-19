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
            if(game.timeLeft===10){
                return
            }
            game.answerSelected=true;
            $(this).addClass('bg-warning')
            player.selection = $(this).children().first().text()
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
});
var settings = {
    initTime : 10,
    qCount:10,
    category:'All',
    difficulty:'Any',
    type:'Any'
}
var parameters={
    amount:1
}
var game = {
    url:function(){
        var url = "https://opentdb.com/api.php";
        url+= '?' +$.param(parameters);
        console.log(url)
        return url
    },
    start:function(){
        game.getQuestion()
    },
    getQuestion:function(){
        if (game.questionNumber ==10){
            game.end()
            return
        }

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
            card.append(answer)
            $(".qCard").append(card)
        }
    },
    answerSelected:false,
    timeLeft:settings.initTime,
    counter: function(){
        game.displayCounter() //making sure that counter is displayed before or with the question.
        var timer = setInterval(()=>{
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
    timeOut:function(){
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
        $(".questionCount").text(game.questionNumber);
        $(".playerScore").text(player.score);
        $(".playerHighScore").text(player.highscore)
    },
    end: function(){
        game.clear();
        var title = $("<h3 class='text-center'>").html("You have answered 10 questions!<br>Your score for this round is: <p>"+player.score+"</p>")
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
        correctAnswerCard.addClass('bg-success text-light')
    },
    correct:function(){
        player.score+=1
        var correctAnswerCard = findAnswerCard(game.round.correct)
        correctAnswerCard.removeClass("bg-warning")
        correctAnswerCard.addClass('bg-success text-light')
        if(player.score>player.highscore){
            player.highscore=player.score
        }
        localStorage.setItem("highscore",player.highscore)
    },
    score:0,
    highscore:Number(localStorage.getItem("highscore"))||0
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
    var ind = text.indexOf("&#039;")
    if (ind > -1){
        text = text.slice(0,ind)+"'"+text.slice(ind+6)
    }

    var answers = $(".answers").children().first().children()
    for (var i=1 ; i<answers.length;i++){
        var card = answers[i]
        if (card.firstChild.innerText === text){
            return $(card) //returning as a jquery element
        }
    }
}
function randomizeAnswers(correct,incorrects){
    var list = [];
    incorrects.push(correct);
    for (var i =0 ; i<incorrects.length;i++){
        var randIndex = Math.floor(Math.random()*list.length);
        list.splice(randIndex,0,incorrects[i]);
    }
    return list
}