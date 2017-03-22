require('dotenv').config();

const Twit = require('twit');
const later = require('later');
const kraut = require('kraut');

const OWN_TWITTER_NAME = 'krautipsum';

class KrautBot {

  constructor() {
    this.twit = null;
  }

  canStart() {
     return process.env.START_TWITTER_BOT || false;
  }

  hasAllAuthKeys() {
    return !!process.env.CONSUMER_KEY 
    && !!process.env.CONSUMER_SECRET 
    && !!process.env.ACCESS_TOKEN 
    && !!process.env.ACCESS_TOKEN_SECRET;
  }

  initTwit() {
    if(this.canStart() && this.hasAllAuthKeys()) {

      this.twit = new Twit({
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET,
        timeout_ms: 60*1000
      });

      console.log('--> initialized kraut bot');
      return true;
    } else {
      
      console.log('--> could not initialize kraut bot');
      this.twit = null;
      return false;
    }
  }

  initDailyTweetSchedulers() {

    this.morningTweetSchedule = later.parse.cron('6 7 * * *');
    this.morningTweetTimer = later.setInterval(() => {
      this.postDailyTweet('#earlykraut')
    }, this.morningTweetSchedule);

    this.lunchTweetSchedule = later.parse.cron('37 14 * * *');
    this.lunchTweetTimer = later.setInterval(() => {
      this.postDailyTweet('#lunchkraut')
    }, this.lunchTweetSchedule);

    this.bedtimeTweetSchedule = later.parse.cron('21 22 * * *');
    this.bedtimeTweetTimer = later.setInterval(() => {
      this.postDailyTweet('#bedkraut')
    }, this.bedtimeTweetSchedule);

    console.log('--> initialized daily tweet schedulers');
  }

  postDailyTweet(hashTag) {

      let dailyKrautTweet = kraut.ipsum.makeSentence();
      if(hashTag) {
        dailyKrautTweet = `${dailyKrautTweet} ${hashTag}`;
      }

      this.twit.post('statuses/update', { status: dailyKrautTweet }, () => {
        console.log(`--> posted daily kraut: ${dailyKrautTweet}`);
      });
  }

  initStreams() {
    this.userStream = this.twit.stream('user');

      this.userStream.on('follow', (followEvent) => {
        if(followEvent.source.screen_name !== OWN_TWITTER_NAME) {
          const newFollowerTweet = `${kraut.greetings.random()} @${followEvent.source.screen_name}`;
          this.twit.post('statuses/update', { status: newFollowerTweet }, () => {
            console.log(`--> posted welcome tweet: ${newFollowerTweet}`);
        });
      }
    });

    this.userStream.on('tweet', (tweetEvent) => {
      if(tweetEvent.user.screen_name !== OWN_TWITTER_NAME) {
        const replyTweet = `${kraut.ipsum.makeSentence()} @${tweetEvent.user.screen_name}`;
        this.twit.post('statuses/update', { status: replyTweet, in_reply_to_status_id: tweetEvent.id_str }, () => {
          console.log(`--> posted reply tweet: ${replyTweet}`);
        });
      }
    });

    this.userStream.on('disconnect', function (disconnectMessage) {
      console.log(`--> disconnect: ${disconnectMessage}`);
    });

    this.userStream.on('warning', function (warning) {
      console.log(`--> warning: ${warning}`);
    });

    console.log('--> initialized user streams');
  }

  start() {
    if(this.initTwit()) {
      this.initDailyTweetSchedulers();
      this.initStreams();
      console.log('--> started kraut bot');
    }
  }
}

module.exports = KrautBot;