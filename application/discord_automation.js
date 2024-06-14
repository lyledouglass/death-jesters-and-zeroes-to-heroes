const POST_URL = "WEBHOOK_URL_HERE";
const MAX_EMBED_LENGTH = 6000;
const MAX_FIELD_VALUE_LENGTH = 1024;
const MAX_FIELDS_PER_EMBED = 25;

function onSubmit(e) {
    const response = e.response.getItemResponses();
    let items = [];
    let charName = "";
    let realmName = "";
    let classSpec = "";
    let threadId = ""; // Store the thread ID for the first message

    for (const responseAnswer of response) {
        const question = responseAnswer.getItem().getTitle();
        var answer = responseAnswer.getResponse();
        let parts = [];

        if (typeof answer === 'string') {
            parts = answer.match(/[\s\S]{1,1024}/g) || [];
        } else {
            parts = [String(answer)];
        }

        if (!answer) {
            continue;
        }

        if (question.match("Character Name")) {
            charName = answer;
        }

        if (question.match("Current Realm")) {
            realmName = answer;
        }

        if (question.match("Class and Spec")) {
            classSpec = answer;
        }

        if (question.match("Please link your Warcraft Logs")) {
            answer = "[Warcraft Logs Link](" + answer + ")";
        }

        if (question.match("Please Upload a picture of your in-combat raid UI to IMGUR or other site and link it here")) {
            answer = "[UI Link](" + answer + ")";
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

    let title = charName + " - " + classSpec;
    if (title.length > 100) {
        title = title.substring(0, 100);
    }

    const embeds = [];
    let currentEmbedItems = [];
    let currentEmbedLength = 0;

    // Static parts of the embed
    const baseEmbedLength = 200; // Approximate static length including title, footer, etc.

    function calculateItemLength(item) {
        return item.name.length + item.value.length + 12; // 12 accounts for name and value JSON syntax overhead
    }

    function createEmbed(fields) {
        const embed = {
            title: title,
            color: 33023,
            fields: fields,
            footer: {
                text: "",
            },
            timestamp: new Date().toISOString(),
            thread_id: threadId, // Always include thread_id for consistency
        };

        return embed;
    }

    for (const item of items) {
        const itemLength = calculateItemLength(item);

        if (currentEmbedLength + itemLength + baseEmbedLength > MAX_EMBED_LENGTH || currentEmbedItems.length >= MAX_FIELDS_PER_EMBED) {
            if (currentEmbedItems.length > 0) {
                console.log("Creating a new embed with length: " + currentEmbedLength);
                embeds.push(createEmbed(currentEmbedItems));
            }
            currentEmbedItems = [];
            currentEmbedLength = 0;
        }

        currentEmbedItems.push(item);
        currentEmbedLength += itemLength;
    }

    if (currentEmbedItems.length > 0) {
        console.log("Final embed with length: " + currentEmbedLength);
        embeds.push(createEmbed(currentEmbedItems));
    }

    console.log("Total embeds created: " + embeds.length);

    // Send each embed as a separate message
    for (let i = 0; i < embeds.length; i++) {
        const embed = embeds[i];
        const payload = {
            content: null,
            embeds: [embed], // Sending only one embed in each payload
            username: "New App Submission",
            thread_name: i === 0 ? title : undefined, // Include thread_name for the first message only
        };

        const payloadString = JSON.stringify(payload);
        console.log("Payload length: " + payloadString.length);

        const options = {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            payload: payloadString,
        };

        try {
            const response = UrlFetchApp.fetch(POST_URL, options);
            const responseData = JSON.parse(response.getContentText());
            threadId = responseData.thread_id || threadId; // Update thread ID for subsequent messages
        } catch (error) {
            console.log("Error: " + error.message);
        }
    }
}
