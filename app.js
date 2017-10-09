const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const REDIS_RANKING_KEY = 'ranking';

var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
  console.log("Error " + err);
});

// urlencodedとjsonは別々に初期化する
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.listen(3000, function () {
  console.log('listening start on port 3000.');
});

/**
 * ランキング取得 API
 *
 * @param req.query.user_id {string} - ユーザーID
 */
app.get('/ranking', function (req, res) {
  res.header("Content-Type", "application/json; charset=utf-8");
  if (req.query.user_id == null) {
    let msg = 'user_id is empty.';
    res.status(500).json(msg);
    console.error(ms);
    return;
  }

  client.zrevrank(
    [
      REDIS_RANKING_KEY,
      req.query.user_id
    ],
    function (err, response) {
      if (err) {
        res.status(500).json(err.message);
        console.error(err);
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
 * スコア記録 API
 *
 * @param req.body {Object} - {user_id: (int), score: (int)}
 */
app.post('/score', function(req, res) {
  res.header("Content-Type", "application/json; charset=utf-8");
  const params = req.body;
  if (params.user_id == null || params.score == null) {
    let msg = 'user_id, score is empty.: ' + JSON.stringify(params);
    res.status(500).json(msg);
    console.error(msg);
    return;
  }

  client.zadd(
    [
      REDIS_RANKING_KEY,
      params.score,
      params.user_id
    ],
    function (err, response) {
      if (err) {
        res.status(500).json(err.message);
        console.error(res);
        return;
      }
      console.log('[score] added '+response+' items.');

      res.json(response);
    });
});
