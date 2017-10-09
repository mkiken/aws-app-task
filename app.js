const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// urlencodedとjsonは別々に初期化する
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.listen(3000, function () {
  console.log('listening start on port 3000.');
});

// ランキング取得 API
app.get('/ranking', function (req, res) {
  res.send('ranking page.');
});

// スコア記録 API
app.post('/score', function(req, res) {
    // リクエストボディを出力
    console.log(req.body);
    // パラメータ名、nameを出力
    console.log(req.body.name);

    res.send(req.body);
});
