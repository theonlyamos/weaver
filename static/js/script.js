const colors = {
    windows: 'primary',
    linux: 'warning',
    apple: 'dark',
    android: 'success'
}


const flyInfo = (id)=>{
    let fly = localStorage.getItem(id)
    $("#homeTab").text(fly)
    $('#flyInfo').removeClass('d-none')
}

const displayTrappedFly = (id, fly)=>{
    let flyHtml = 
    `<a href="#" class="card shadow d-flex flex-row p-3 mb-2 text-decoration-none">
        <i class="fab fa-${fly.os.toLowerCase()} fa-3x text-${colors[fly.os.toLowerCase()]} pe-3 border-end"></i>
        <div class="d-flex flex-column machine-info ps-3" id="machine${id}">
            <small class="font-monospace line-height-1 username"><code>username: <em class="value text-dark">${fly.username}</em></code></small>
            <small class="font-monospace line-height-1 host"><code>host: <em class="value text-dark">${fly.host}:${fly.port}</em></code></small>
            <small class="font-monospace line-height-1 os"><code>os: <em class="value text-dark">${fly.os} ${fly.osversion}</em></code></small>
            <small class="font-monospace line-height-1 home-dir"><code>homedir: <em class="value text-dark">${fly.home}</em></code></small>
        </div>
    </a>`

    $('#machines').append(flyHtml)
}

const addTrappedFly= (fly)=>{
    let flyName = btoa(fly[0]+fly[2]+fly[3]+fly[5])
    flyName = flyName.replaceAll("=", "")
    let flyObject = {
        host: fly[0],
        port: fly[1],
        username: fly[2],
        os: fly[3],
        osversion: fly[4],
        home: fly[5]
    }
    
    localStorage.setItem(flyName, JSON.stringify(flyObject))
    if (!$(`#${flyName}`).length){
        displayTrappedFly(flyName, flyObject)
    }
}

const getConnections = ()=>{
    $.ajax({
        type: "get",
        url: "/connections",
        dataType: "json",
        success: (flies)=>{
            for (let i in flies){
                let fly = flies[i]
    
                addTrappedFly(fly)
            }
        }
    })
}

function spawnNotification(body, icon, title) {
    var options = {
        body: body,
        icon: icon
    };
    var n = new Notification(title, options);
}

$(function(){
    getConnections()
    /**
    Notification.requestPermission().then(function(result) {
    });

    $("button#logout-button").on('click touchstart', logout)

    //$(".complain-button").on('click', post_feedback);

    $("div.notification").on('click', function(){
        localStorage.removeItem("notifications")
        $("span.notifier").html(0)
        $("img.notify").attr("src", "static/images/notify.png")
    })
    */
})
