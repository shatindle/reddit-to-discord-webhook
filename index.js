const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const snoowrap = require("snoowrap");
const webhook = require("webhook-discord");
const oauth_info = require("./oauth_info.json");
const webhook_url = require("./webhook.json");

const adapter = new FileSync("db.json");
const db = low(adapter);

const Hook = new webhook.Webhook(webhook_url.url);

db.defaults({ processedposts: [] }).write();

const r = new snoowrap(oauth_info);

function processSubreddit() {
  r.getSubreddit("r/Splatoon")
    .getNew()
    .then((submissions) => {
      submissions.forEach((submission) => {
        var post = {
          flair: submission.author_flair_text,
          title: submission.title,
          thumbnail: submission.thumbnail,
          postedOn: submission.created,
          id: submission.id,
          user: submission.author.name,
          url: submission.permalink,
          flairId: submission.author_flair_css_class,
        };

        var result = db
          .get("processedposts")
          // @ts-ignore
          .find({ id: post.id })
          .value();

        if (!result && post.flairId === "???") {
          // new post
          db.get("processedposts")
            // @ts-ignore
            .push(post)
            .write();

          var message = new webhook.MessageBuilder()
            .setName("Art submission by u/" + post.user)
            .setColor("#F02D7D")
            .setImage(post.thumbnail)
            .setText(post.title + "\n\nhttps://reddit.com" + post.url);

          Hook.send(message);
        }
      });

      setTimeout(processSubreddit, 60000);
    });
}

processSubreddit();
