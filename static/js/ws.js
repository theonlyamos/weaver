function send_message(){
    if ($("textarea").val().length !=0){
        var msg = {"body": $("textarea").val(),
                   "user_id": get_info("_id", "user"),
                   "user_name": (get_info("fullname", "user")).split(" ")[0],
                   "date": new Date().toUTCString()
        }
        $("textarea").val("")
        socketio.send(msg)
    }
}

$(function(){
    socketio = io.connect(location.origin)

    socketio.on("message", function(msg){
        if (typeof(msg) == 'object'){
            console.log(msg)
            if (msg.hasOwnProperty('flies')){
                for (let i in msg.flies){
                    let fly = msg.flies[i]
                    
                    addTrappedFly(fly)
                }
            }

            else if (msg.hasOwnProperty('fly')){
                addTrappedFly(msg.fly)
            }
        }
    })

    socketio.on("json", function(msg){
        console.log(msg)
    })

    socketio.on("flies", function(flies){
        for (let i in flies){
            let fly = flies[i]

            addTrappedFly(fly)
        }
    })

    socketio.on('fly', (fly)=>{
        console.log(fly)
    })

    $("button.btn-message").on('click', send_message)
});
