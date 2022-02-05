let identityData = {
    uuid: "",
    accountId: 0,
    highestCurrentLadder: 1
}

function setCookie(cName, cValue, expDays) {
    const d = new Date();
    d.setTime(d.getTime() + (expDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function login() {
    let uuid = getCookie("_uuid")
    if (uuid === "" && !confirm("Do you want to create a new account?")) {
        return;
    }

    stompClient.send("/app/account/login", {}, JSON.stringify({
        'uuid': uuid
    }));
}


function onLoginReceived(message) {
    if (message.status === "OK" || message.status === "CREATED") {
        if (message.content) {
            identityData = message.content;
            setCookie("_uuid", identityData.uuid, 365 * 5);
        }

        // Init Chat Connection
        chatSubscription = stompClient.subscribe('/topic/chat/' + identityData.highestCurrentLadder,
            (message) => handleChatUpdates(JSON.parse(message.body)), {uuid: getCookie("_uuid")});
        stompClient.subscribe('/user/queue/chat/',
            (message) => handleChatInit(JSON.parse(message.body)), {uuid: getCookie("_uuid")});
        initChat(identityData.highestCurrentLadder);

        // Init Ladder Connection
        ladderSubscription = stompClient.subscribe('/topic/ladder/' + identityData.highestCurrentLadder,
            (message) => handleLadderUpdates(JSON.parse(message.body)), {uuid: getCookie("_uuid")});
        stompClient.subscribe('/user/queue/ladder/',
            (message) => handleLadderInit(JSON.parse(message.body)), {uuid: getCookie("_uuid")});
        stompClient.subscribe('/user/queue/ladder/updates',
            (message) => handlePrivateLadderUpdates(JSON.parse(message.body)), {uuid: getCookie("_uuid")});
        initLadder(identityData.highestCurrentLadder);
    }
}

async function importCookie() {
    let newUUID = prompt("Paste your ID into here (your old uuid will be copied into your clipboard):");
    try {
        if (newUUID) {
            // TODO: Check if cookies are valid
            let oldUuid = getCookie("_uuid");
            setCookie("_uuid", newUUID, 365 * 5);
            setTimeout(async () => await navigator.clipboard.writeText(oldUuid), 1000);
            // Relaod the page for the new cookies to take place
            setTimeout(() => location.reload(), 1500);
        }
    } catch (err) {
        alert("Invalid ID!")
        console.error(err)
    }
}

async function exportCookie() {
    // Copy the text inside the text field
    await navigator.clipboard.writeText(getCookie("_uuid"));

    // Alert the copied text
    alert("Copied your ID to your clipboard! (don't lose it or give it away!)");
}