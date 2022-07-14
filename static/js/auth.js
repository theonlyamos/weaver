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
    if (!localStorage["sikafie"]){
        localStorage["sikafie"] = ''
    }
    if ((localStorage["sikafie"]).length == 0){
        return false
    }
    store = JSON.parse(localStorage["sikafie"])
    if (main){
        if (store[main]){
            sub = store[main]
            return sub[key]
        }
    }
    return store[key]
}

function login(username, password){
    if (username.length == 0){
        $("strong.alert-login-text").text("Please enter username");
        $(".alert-login").show()
    }else if (password.length == 0){
        $("strong.alert-login-text").text("Please enter password");
        $(".alert-login").show()
    }else{
        var tosend = {username: username, password: password};
        $.ajax({
            type: "post",
            url: "/auth",
            contentType: "application/json",
            processData: false,
            data: JSON.stringify(tosend),
            statusCode: {500: function(){$("strong.alert-login-text").text("User does not exist");
                                         $(".alert-login").show();},
                         401: function(){$("strong.alert-login-text").text("Invalid credentials")
                                         $(".alert-login").show();}
                        },
            success: function(data){update_info({"token": data["access_token"], "password": password,
                                                 "username": username}, "user");
                                                  get_user_details(username, get_info("token", "user"));}
        })
    }
}

function register(){
    var fullname = $("input.fullname").val();
    var username = $("input.register-tel").val();
    var password = $("input.register-password").val();
    var confirm = $("input.confirm-password").val();
    if (fullname.length == 0){
        $("strong.alert-register-text").text("Enter Your Full Name");
        $(".alert-register").show();
    }else if (confirm != password) {
        $("strong.alert-register-text").text("passwords do not match");
        $(".alert-register").show();
    }else{
        var hashed = sha512(password);
        var content = {fullname: fullname, username: username,
                       password: hashed}

        $.ajax({
            type: "post",
            url: "/register",
            dataType: "json",
            contentType: "application/json",
            processData: false,
            data: JSON.stringify(content),
            statusCode: {401: function(){$("strong.alert-register-text").text("User already exists");
                                         $(".alert-register").show();}
                        },
            success: function(data){login(username, hashed)}
        })
    }
}

function get_user_details(username, token){
    $.ajax({
        type: "get",
        url: "/user/"+username,
        headers: {"Authorization": "JWT "+token},
        dataType: "json",
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"));
                                     get_user_details(username, get_info("token", "user"))}},
        success: function(data){data["password"] = get_info("password", "user");
                                update_info(data, "user");
                                if (data["role"] == "user"){
                                    window.location.href = "/home";
                                }else {
                                    window.location.href = "/admin";
                                }}
    })
}

function get_pledges(user_id, token){
    $.ajax({
        type: "get",
        url: "/pledges/"+user_id,
        headers: {"Authorization": "JWT "+token},
        dataType: "json",
        statusCode: {500: function(){login(get_info("username", "user"), get_info("password", "user"));
                                     get_pledges(get_info("username", "user"), get_info("token", "user"));}},
        success: function(data){update_info(data, "pledges")}
    })
}

$(function(){
    $("#noticeModal").modal("show");
    if (navigator.onLine){
        if (get_info("token", "user")){
            login(get_info("username", "user"), get_info("password", "user"));
        }else {
            localStorage["sikafie"] = JSON.stringify({});
            $("article").hide();
            $("article.login-page").show();
        }
    }else {
        if (get_info("token", "user")){
            window.location.href = "/home"
        }else {
            localStorage["sikafie"] = JSON.stringify({});
            alert("You have no internet connection!!");
            $("article").hide();
            $("article.login-page").show();
        }
    }

    $(document).on('click touchstart', "button#login_button", function(){
        var username = $("input.login-tel").val();
        var password = sha512($("input.login-password").val());
        login(username, password);
    });


    $(document).on('click touchstart', "button#register_button", register);
})
