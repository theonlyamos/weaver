function update_info(info={}, main=""){
    store = JSON.parse(localStorage["sikafie"])
    if (main){
        if (!store[main]){
            store[main] = {}
        }
        sub = store[main]
        for (key in info){
            sub[key] = info[key]
        }
        store[sub] = sub
        localStorage['sikafie'] = JSON.stringify(store)
    }else{
        for (key in info){
            store[key] = info[key]
        }
        localStorage['sikafie'] = JSON.stringify(store)
    }
}

function get_info(key, main=""){
    store = JSON.parse(localStorage["sikafie"])
    if (main){
        if (store[main]){
            sub = store[main]
            return sub[key]
        }
    }
    return store[key]
}

function get_user_details(username, token){
    $.ajax({
        type: "get",
        url: "/user/"+username,
        headers: {"Authorization": "JWT "+token},
        dataType: "json",
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"))}},
        success: function(data){data["password"] = get_info("password", "user");
                                update_info(data, "user");
                                if (data["role"] == "user"){
                                    window.location.href = "/home";
                                }else {
                                    window.location.href = "/admin";
                                }}

    })
}

function login(username, password){
    var tosend = {username: username, password: password};
    $.ajax({
        type: "post",
        url: "/auth",
        contentType: "application/json",
        processData: false,
        data: JSON.stringify(tosend),
        statusCode: {500: function(){$("h4.login").text("User does not exist")},
                     401: function(){$("h4.login").text("Invalid credentials")}},
        success: function(data){update_info({"token": data["access_token"]}, "user");
                                get_user_details(username, data["access_token"]);}
    })
}

function get_details(){
    var username = get_info("username", "user");
    var token = get_info("token", "user");

    $.ajax({
        type: 'get',
        url: '/admin/details',
        headers: {"Authorization": "JWT "+token},
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"));
                                     get_details();}},
        success: function(data){update_info(data, "details");set_details();}
    })
}

function set_details(){
    if (get_info("users", "details")){
        var users = get_info("users", "details")
        var num = []
        for (user in users){
            num.push(user)
        }
        $("tr.users td.num").html(num.length)
    }

    if (get_info("pledges", "details")){
        $("table.pledges").html("");
        var pledges = get_info("pledges", "details")
        var num = []
        var amount = 0
        for (pledge in pledges){
            pb = pledges[pledge]
            if (!pb.redeemed && !pb.expired){
                num.push(pb)
                amount += parseInt(pb.amount)
            }
        }
        num.reverse()
        for (i=0; i<=num.length-1; i++){
            var date = new Date(num[i].date).toDateString()
            var amt = num[i].amount
            var user_id = num[i].user_id


            var users = get_info("users", "details")
            for (user in users){
                if (users[user]._id == user_id){
                   var username = users[user].username
                   var fullname = users[user].fullname
                }
            }

            var line = "<tr class='pledge' data-action='"+num[i]._id+"'>"
            line += "<td class='user'><h3>"+fullname+"</h3>"
            line += "<h3 class='uname'>["+username+"]</h3></td>"
            line += "<td class='date'>"+date+"</td>"
            line += "<td class='amount'>GH&cent;"+amt+"</td></tr>"

            $("table.pledges").append($(line))
        }
        $("tr.pledges td.num").html(num.length)
        $("tr.pledges td.amount").html("GH&cent;"+amount.toString()+".00")

    }

    if (get_info("pledges", "details")){
        $("table.payouts").html("");
        var db = get_info("details")
        redeems = []
        for (pledge in db.pledges){
            if (db.pledges[pledge].redeemed && !db.pledges[pledge].expired){
                redeems.push(db.pledges[pledge])
            }
        }
        redeems.reverse();
        var amount = 0;
        for (i=0; i<=redeems.length-1; i++){
            amount += parseInt(redeems[i].amount)

            var date = new Date(redeems[i].date).toDateString()
            var amt = parseInt(redeems[i].amount)
            if (amt > 40){
                amt = (amt*2) - (amt+15)
            }else{
                var amt = (amt*2) - (amt+10)
            }
            var user_id = redeems[i].user_id
            var count = redeems[i].count


            var users = get_info("users", "details")
            for (user in users){
                if (users[user]._id == user_id){
                   var username = users[user].username
                   var fullname = users[user].fullname
                }
            }

            var line = "<tr class='pay' data-action='"+redeems[i]._id+"'>"
            line += "<td class='user'><h3>"+fullname+"</h3>"
            line += "<h3 class='uname'>["+username+"]</h3></td>"
            line += "<td class='date'>"+date+"</td>"
            line += "<td class='amount'>GH&cent;"+amt+"</td>"
            line += "<td class='count'>"+count+"</td></tr>"

            $("table.payouts").append($(line))
        }
        $("tr.payments td.num").html(redeems.length)
        $("tr.payments td.amount").html("GH&cent;"+amount.toString()+".00")

    }

    if (get_info("pledges", "details")){
        pledges = get_info("pledges", "details")
        num = 0
        total = 0
        for (x in pledges){
            if (pledges[x].redeemed){
                num += 1
                total += parseInt(pledges[x].amount)
            }
        }

        var received = (num*15)+total
        $("tr.received td.num").html(num)
        $("tr.received td.amount").html("GH&cent;"+received.toString()+".00")
    }

    if (get_info("feedbacks", "details")){
        var feedbacks = get_info("feedbacks", "details")
        var num = []
        for (fd in feedbacks){
            num.push(fd)
        }
        $("tr.feedbacks td.num").html(num.length)
    }

    if (get_info("payments", "details")){
        var payments = get_info("payments", "details")
        var num = 0
        var total = 0

        for (pay in payments){
            num += 1
            total += parseInt(payments[pay].amount)
        }

        $("tr.paid td.num").html(num)
        $("tr.paid td.amount").html("GH&cent;"+total.toString()+".00")
    }

    if (get_info("feedbacks", "details")){
        $("article.help div.feeds").html("")
        feeds = get_info("feedbacks", "details")
        fd = []
        for (x in feeds){
            if (!feeds[x].replied) {
                fd.push(feeds[x])
            }
        }
        fd.reverse()

        for (i=0; i<=fd.length-1; i++){
            users = get_info("users", "details")
            if (users[fd[i].user_id]){
                user = users[fd[i].user_id]

                var line = "<ul class='feeds-list' data-action='"+fd[i]._id+"'>"
                line += "<li class='user'>User: "+user.fullname
                line += " ["+user.username+"]</li>"
                line += "<li class='content'>Content: "+fd[i]["content"]+"</li></ul>"
                $(line).appendTo($("article.help div.feeds"))
            }
        }
    }
}

function redeem_pledge(pledge_id, user_id){
    $.ajax({
        type: 'post',
        url: '/pledge/'+pledge_id,
        headers: {"Authorization": "JWT "+get_info("token", "user")},
        contentType: "application/json",
        dataType: "json",
        processData: false,
        data: JSON.stringify({"user_id": user_id}),
        success: function(data){$("div.pledge-details").remove();get_details();},
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"))
                                redeem_pledge(pledge_id, user_id)}}

    })
}

function delete_pledge(pledge_id){
    $.ajax({
        type: 'delete',
        url: '/pledge/'+pledge_id,
        headers: {"Authorization": "JWT "+get_info("token", "user")},
        contentType: "application/json",
        success: function(data){$("div.pledge-details").remove();get_details();},
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"))
                                delete_pledge(pledge_id)}}

    })
}

function make_payment(amount, user_id, pledge_id){
    $.ajax({
        type: 'post',
        url: '/pay/'+pledge_id,
        headers: {"Authorization": "JWT "+get_info("token", "user")},
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({"amount": amount, "user_id": user_id}),
        success: function(data){$("div.redeemed-details").remove();get_details();},
        statusCode: {500: function(){login(get_info("username",'user'), get_info("password", "user"));
                                make_payment(amount, user_id, pledge_id)}}
    })
}

function reply_feed(feed_id){
    reply = $("textarea.reply").val();
    $.ajax({
        type: 'post',
        url: '/feedback/'+feed_id,
        headers: {"Authorization": "JWT "+get_info("token", "user")},
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({"reply": reply}),
        success: function(data){$("div.feed-details").remove();get_details();},
        statusCode: {500: function(){login(get_info("username",'user'), get_info("password", "user"));
                                reply_feed(feed_id)}}
    })

}

function logout(){
    localStorage.removeItem("sikafie");
    window.location.href = "/";
}

function set_user_details(){
    $("header h2").html(get_info("fullname", "user")+" [ADMIN]");
}

function spawnNotification(body, icon, title) {
    var options = {
        body: body,
        icon: icon
    };
    var n = new Notification(title, options);
}

function set_users(){
    users = []
    pledges = []
    payments = []
    feeds = []

    $("table.users").html("");

    var head = "<tr class='info'>"
    head += "<th class='name'>User</th>"
    head += "<th class='name'>Pd</th>"
    head += "<th class='name'>Rd</th>"
    head += "<th class='name'>Pm</th>"
    head += "<th class='name'>Fd</td></tr>"

    $("table.users").append($(head));

    if (!$.isEmptyObject(get_info("users", "details"))){
        users = get_info("users", "details");
    }

    if (!$.isEmptyObject(get_info("pledges", "details"))){
        pledges = get_info("pledges", "details");
    }

    if (!$.isEmptyObject(get_info("feedbacks", "details"))){
        payments = get_info("pledges", "details");
    }

    if (!$.isEmptyObject(get_info("feedbacks", "details"))){
        feeds = get_info("feedbacks", "details");
    }

    for (user in users){
        pnum = 0;
        pamount = 0;
        rnum = 0;
        ramount = 0;
        pynum = 0;
        pyamount = 0;
        fnum = 0;
        for (pledge in pledges){
            if (pledges[pledge].user_id == users[user]._id){
                pnum++;
                pamount += parseInt(pledges[pledge].amount);
                if (pledges[pledge].redeemed && !pledges[pledge].expired){
                    rnum++;
                    ramount += parseInt(pledges[pledge].amount);
                }
                else if (pledges[pledge].redeemed && pledges[pledge].expired){
                    pynum++;
                    pyamount += parseInt(pledges[pledge].amount);
                }
            }
        }

        for (feed in feeds){
            if (feeds[feed].user_id == users[user]._id){
                fnum++;
            }
        }

        var line = "<tr class='user' data-id='"+user+"'>"
        line += "<td class='name'><h3>"+users[user].fullname+"</h3>"
        line += "<h3 class='uname'>["+users[user].username+"]</h3></td>"
        line += "<td class='pledges'><h3>"+pnum+"<h/3>"
        line += "<h3 class='amount'>GH&cent;"+pamount+"</h3></td>"
        line += "<td class='redeems'><h3>"+rnum+"</h3></td>"
        line += "<h3 class='amount'>GH&cent;"+ramount+"</h3></td>"
        line += "<td class='pout'><h3>"+pynum+"</h3>"
        line += "<h3 class='amount'>GH&cent;"+pyamount*2+"</h3></td>"
        line += "<td class='feeds'><h3>"+fnum+"</h3></td></tr>";

        $("table.users").append($(line));

        $('img.close').on('click',function(){
            $("article").each(function(){
                if ($(this).hasClass(action)){
                    $(this).hide();
                    $('article.home').show();
                }
            })
        })
    }


}
/*
function startWorker() {
    if(typeof(Worker) !== "undefined") {
        var worker = new Worker("/static/js/ws.js");
        var username = get_info("username", "user");
        var token = get_info("token", "user");
        var user_id = get_info("_id", "user");
        var password = get_info("password", "user")
        var role = get_info("role", "user")
        worker.postMessage({username: username, token: token, user_id: user_id, password: password, role: role})
        worker.onmessage = function(event) {
            if (event.data == 'refresh'){
                window.location.href = '/admin'
            }else{
              update_info(event.data, "details")
              if (!($.isEmptyObject(event.data["notifications"]))){
                    var audio = new Audio(location.origin+'/static/sounds/notify.ogg');
                    audio.autoplay = true;
                    audio.load();

                    notifies = []
                    notes = get_info("notifications", "details")
                    for (x in notes){notifies.push(notes[x])}
                    $("span.notifier").html(notifies.length)
                    $("img.notify").attr("src", "static/images/notifier.png")

                    for (x in notes){
                        nd = notes[x]
                        icon = location.origin+'/static/images/'+x.icon
                        spawnNotification(x.content, icon, x.title)
                    }
              };
              set_details();
          }

      };
    } else {
        console.log('WebWorker not supported!!!')
    }
}
*/
$(function(){
/*
    $(document).ajaxStart(function(){
        $("div.loader-page").show();
    })
    $(document).ajaxStop(function(){
        $("div.loader-page").hide();
    })
*/

    set_user_details();
    get_details();
    //startWorker();
    //set_pledges();

    Notification.requestPermission().then(function(result) {
    });

    $("div.tab").on('click', function(){
        $("article").hide();
        $(".tab").removeClass("current_tab");
        $(this).addClass("current_tab");
        var action = $(this).attr("data-action");
        $("article").each(function(){
            if ($(this).hasClass(action)){
                $(this).show();
            }
        })
    })

    $(".logout-button").on('click', logout);

    $('img.refresh').on('click', function(){
            get_details();
    })

    $("table.pledges").on('click','tr', function(){
        id = $(this).attr('data-action')
        pledges = get_info("pledges", "details")
        for (pledge in pledges){
            if (pledge == id){
                pd = pledges[pledge]
            }
        }
        users = get_info("users", "details")
        for (x in users){
            if (users[x]._id == pd.user_id){
                user = users[x]
            }
        }

        fullname = user.fullname
        username = user.username

        $("div.pledge-details").remove();
        var platform = "<div class='pledge-details'>";
        platform += "<img class='close' src='static/images/close.png'/>"
        platform += "<table class='pd-details'><tr>"
        platform += "<th>ID</th><td>"+pd._id+"</td></tr>"
        platform += "<tr><th>Name</th><td>"+fullname+"</td></tr>"
        platform += "<tr><th>User</th><td>"+username+"</td></tr>"
        platform += "<tr><th>Amount</th><td>GH&cent;"+pd.amount+"</td><td></tr>"
        platform += "<tr><th>Date</th><td>"+pd.date+"</td>"
        platform += "<tr><th>Expired</th><td>"+pd.expired+"</td>"
        platform += "<tr><th>Redeemed</th><td>"+pd.redeemed+"</td>"
        platform += "</tr></table>"
        platform += "<input type='button' class='delete' value='Delete'/>"
        platform += "<input type='button' class='redeem' value='Redeem'/></div>"

        $('body').append($(platform));
        $(platform).show();

        $('img.close').on('click',function(){
            $("div.pledge-details").remove()
        })

        $("input.redeem").on('click', function(){
            redeem_pledge(pd._id, user._id)
        })

        $("input.delete").on('click', function(){
            delete_pledge(pd._id)
        })

    })

    $("table.payouts").on('click','tr', function(){
        id = $(this).attr('data-action')
        pledges = get_info("pledges", "details")
        for (pledge in pledges){
            if (pledge == id){
                pd = pledges[pledge]
            }
        }
        users = get_info("users", "details")
        for (x in users){
            if (users[x]._id == pd.user_id){
                user = users[x]
            }
        }

        $("div.redeemed-details").remove();
        var platform = "<div class='redeemed-details'>";
        platform += "<img class='close' src='static/images/close.png'/>"
        platform += "<table class='pd-details'><tr>"
        platform += "<th>ID</th><td>"+pd._id+"</td></tr>"
        platform += "<tr><th>Name</th><td>"+user.fullname+"</td></tr>"
        platform += "<tr><th>User</th><td>"+user.username+"</td></tr>"
        platform += "<tr><th>Amount</th><td>GH&cent;"+pd.amount+"</td></tr>"
        platform += "<tr><th>Date</th><td>"+pd.date+"</td>"
        platform += "<tr><th>Expired</th><td>"+pd.expired+"</td>"
        platform += "<tr><th>Redeemed</th><td>"+pd.redeemed+"</td>"
        platform += "</tr></table>"
        platform += "<input type='button' class='payout' value='Payout'/></div>"

        $('body').append($(platform));
        $(platform).show();

        $('img.close').on('click',function(){
            $("div.redeemed-details").remove()
        })

        $("input.payout").on('click', function(){
            amt = parseInt(pd.amount)*2
            make_payment(amt, user._id, pd._id)
            $("div.redeemed-details").remove();
        })

    })

    $("table.details").on('click','tr', function(){
        action = $(this).attr('data-action')
        $('article').hide();
        $("article").each(function(){
            if ($(this).hasClass(action)){
                $(this).show();
                switch(action){
                    case 'users':
                        set_users();
                }
            }
        })

    })

    $("body").on('click', 'ul.feeds-list', function(){
        $("div.feed-details").remove();
        fid = $(this).attr('data-action')
        feeds = get_info("feedbacks", "details")
        for (x in feeds){
            if (feeds[x]._id == fid){
                fd = feeds[x]
            }
        }
        users = get_info("users", "details")
        for (x in users){
            if (users[x]._id == fd.user_id){
                user = users[x]
            }
        }
        user = users[fd.user_id]

        var line = "<div class='feed-details'>"
        line += "<img class='close' src='static/images/close.png'/>"
        line += "<ul><li class='name'>Name: "+user.fullname+"</li>"
        line += "<li class='num'>Number: "+user.username+"</li>"
        line += "<li class='content'>Content: "+fd.content+"</li></ul>"
        line += "<textarea class='reply' placeholder='Reply'></textarea>"
        line += "<input type='button' class='reply' value='Reply'/></div>"

        $("body").append($(line))
        $("div.feed-details").show();

        $('img.close').on('click',function(){
            $("div.feed-details").remove()
        })

        $("input.reply").on("click", function(){
          reply_feed(fd._id)
        })
    })



    $("div.notification").on('click', function(){
        details = get_info("details")
        details["notifications"] = {}
        update_info(details, "details")
        $("span.notifier").html(0)
        $("img.notify").attr("src", "static/images/notify.png")
    })
})
