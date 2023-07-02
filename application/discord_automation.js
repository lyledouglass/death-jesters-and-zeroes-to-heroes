const POST_URL = "WEBHOOK_URL_HERE";
const MAX_EMBED_LENGTH = 6000;

function onSubmit(e) {
    const response = e.response.getItemResponses();
    let items = [];
    let charName = ""
    var realmName = ""
    for (const responseAnswer of response) {
        const question = responseAnswer.getItem().getTitle();
        var answer = responseAnswer.getResponse();
        let parts = []

        try {
            parts = answer.match(/[\s\S]{1,1024}/g) || [];
        } catch (e) {
            parts = answer;
        }

        if (!answer) {
            continue;
        }

        // Here we're doing some matches to gather some extra data for the embed, namely title and url links
        if (question.match("Character Name")) {
          charName = answer
        }

        if (question.match("Current Realm")) {
          realmName = answer
        }

        if (question.match("Class and Spec")) {
            classSpec = answer
        }

        if (question.match("Please link your Warcraft Logs")) {
          answer = "[Warcraft Logs Link](" + answer + ")"
        }

        if (question.match("Please Upload a picture of your in-combat raid UI to IMGUR or other site and link it here")) {
          answer = "[UI Link](" + answer + ")"
        }

        for (const [index, part] of Object.entries(parts)) {
            if (index == 0) {
                items.push({
                    "name": question,
                    "value": part,
                    "inline": false
                });
            } else {
                items.push({
                    "name": question.concat(" (cont.)"),
                    "value": part,
                    "inline": false
                });
            }
        }
    }

    var title = charName + " - " + classSpec
    const embeds = [];

    // Some applications can be quite long, and discord limits embeds to 6k characters. The while loop below will loop
    // through the response and create a "Question Title (Cont.)" to continue the response.
    while (items.length > 0) {
        const currentEmbedItems = items.splice(0, MAX_EMBED_LENGTH);
        const embed = {
            title: title,
            color: 33023,
            fields: currentEmbedItems,
            footer: {
                text: "",
            },
            timestamp: new Date().toISOString(),
        };
        embeds.push(embed);
    }
    const options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        payload: JSON.stringify({
            content: null,
            embeds: embeds,
            username: "New App Submission",
            thread_name: title,
        }),
    };
    UrlFetchApp.fetch(POST_URL, options);
};