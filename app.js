const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const REDIS_RANKING_KEY = 'ranking';

const log4js = require('log4js'); //log4jsモジュール読み込み
const util = require('util');

log4js.configure({
  appenders: {
    everything: { type: 'dateFile', filename: 'logs/all-the-logs.log' }
  },
  categories: {
    default: { appenders: [ 'everything' ], level: 'debug' }
  }
});

const logger = log4js.getLogger(); // ロガー取得


const RedisClustr = require('redis-clustr');
const RedisClient = require('redis');
const config = require("./config.json");
const redis = new RedisClustr({
    servers: [
        {
            host: config.redisClusterHost,
            port: config.redisClusterPort
        }
    ],
    createClient: function (port, host) {
        // this is the default behaviour
        return RedisClient.createClient(port, host);
    }
});
// const redis = require("redis"),
//     client = redis.createClient({
//       host: "mori-ageteq-redis.mk4soq.0001.apne1.cache.amazonaws.com",
//       port: 6379
//     });

redis.on("error", function (err) {
  logger.info("Error " + err);
});

// urlencodedとjsonは別々に初期化する
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.listen(3000, function () {
  logger.info('listening start on port 3000.');
});

/**
 * ランキング取得 API
 *
 * @param req.query.name {string} - ユーザー名
 */
app.get('/user_rank', function (req, res) {
  res.header("Content-Type", "application/json; charset=utf-8");
  if (req.query.name == null) {
    let msg = 'name is empty.';
    res.status(500).json(msg);
    logger.error(msg);
    return;
  }

  redis.zrevrank(
    [
      REDIS_RANKING_KEY,
      req.query.name
    ],
    function (err, response) {
      if (err) {
        res.status(500).json(err.message);
        logger.error(err);
        return;
      }
      if (typeof response === 'number'){
        // 0-originを1-originにする
        response += 1;
      }
      res.json(response);
    });
  });

/**
 * ランキング取得 API
 *
 * @param req.query.name {string} - ユーザー名
 */
app.get('/ranking', function (req, res) {
  res.header("Content-Type", "application/json; charset=utf-8");
  if (req.query.from == null || req.query.to == null || req.query.from > req.query.to) {
    let msg = 'parameter "from" or "to" is invalid.';
    res.status(500).json(msg);
    logger.error(msg);
    return;
  }

  redis.zrevrange(
    [
      REDIS_RANKING_KEY,
      req.query.from - 1,
      req.query.to - 1,
      'withscores'
    ],
    function (err, response) {
      if (err) {
        res.status(500).json(err.message);
        logger.error(err);
        return;
      }

      let rankings = [];
      let index = 0;
      let rank = req.query.from;
      for (let i = 0; i < response.length; i++) {
        rankings.push({
          rank: rank++,
          name: response[i++],
          score: response[i],
        });
      }
      res.json({
        rankings: rankings
      });
    });
  });

/**
 * スコア記録 API
 *
 * @param req.body {Object} - {name: (int), score: (int)}
 */
app.post('/score', function(req, res) {
  res.header("Content-Type", "application/json; charset=utf-8");
  const params = req.body;
  if (params.name == null || params.score == null) {
    let msg = 'name, score is empty.: ' + JSON.stringify(params);
    res.status(500).json(msg);
    logger.error(msg);
    return;
  }

  logger.info(util.format("record score.\t%s\t%d", params.name, params.score));

  redis.zadd(
    [
      REDIS_RANKING_KEY,
      params.score,
      params.name
    ],
    function (err, response) {
      if (err) {
        res.status(500).json(err.message);
        logger.error(res);
        return;
      }

      res.json(response);
    });
});
