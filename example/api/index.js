const express = require("express");
const pagseguro = require("../../src");
const config = require("../config_sample");
const bodyParser = require("body-parser");
const { default: axios } = require("axios");
const { response } = require("express");


/**
 * initialize express
 */
const app = express();

// urlencoded

app.use(express.urlencoded({
  extended: true
}))
/**
 * Middleware
 */
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS, DELETE");
  next();
});

/**
 * Connect pagseguro
 */
const client = pagseguro.connect(config);

/**
 * Hello
 */
app.get("/", function(req, res) {
  res.status(200).json({
    app: "Pagseguro Nodejs Example",
    version: "1.0.0"
  });
});

/**
 * Session
 */
app.post("/session", function(req, res) {
  client.session
    .get()
    .then(data => res.status(data.statusCode).json(data))
    .catch(e => res.status(e.statusCode).json(e));
});

app.post("/TokenCreditCard", function (req,res) {

})


/**
 * Direct Payment
 */
app.post("/directPayment", function(req, res) {
  let method = null;

  switch (req.body.method) {
    case "CREDIT_CARD":
      method = client.transaction.creditCard;
      break;

    case "BOLETO":
      method = client.transaction.boleto;
      break;

    case "ONLINE_DEBIT":
      method = client.transaction.onlineDebit;
      break;
  }

  if (!method) {
    return res.status(422).json({
      status: "error",
      message: "método de pagamento não informado!"
    });
  }

  // Split Test
  // req.body.receivers = [
  //   {
  //     publicKey: "",
  //     split: {
  //       amount: 10.0,
  //       ratePercent: 50.11,
  //       feePercent: 50.11
  //     }
  //   }
  // ];

  method(req.body)
    .then(data => res.status(data.statusCode).json(data))
    .catch(e => {
      console.error(e);
      res.status(e.statusCode || 500).json(e);
    });
});

/**
 * Authorization request
 */
app.get("/authorization/request", function(req, res) {
  const params = {
    permissions: [
      "CREATE_CHECKOUTS",
      "SEARCH_TRANSACTIONS",
      "RECEIVE_TRANSACTION_NOTIFICATIONS",
      "MANAGE_PAYMENT_PRE_APPROVALS",
      "DIRECT_PAYMENT"
    ],
    redirecURL: "http://localhost:3333/authorization/response",
    notificationURL: "http://localhost:3333/authorization/notification"
  };

  client.authorization
    .request(params)
    .then(data => {
      res.redirect(data.content.link);
      // res.status(data.statusCode).json(data);
    })
    .catch(error => {
      console.error(error);
      res.status(e.statusCode).json(e);
    });
});

/**
 * Authorization response
 */
app.get("/authorization/response", function(req, res) {
  const { notificationCode, publicKey } = req.query;
  client.authorization
    .notification(notificationCode)
    .then(data => {
      res.status(200).json(data);
    })
    .catch(error => {
      console.error(error);
      res.status(e.statusCode || 500).json(e);
    });
});

/**
 * Authorization notification
 */
app.get("/authorization/notification", function(req, res) {
  const { notificationCode, notificationType } = req.query;
  client.authorization
    .notification(notificationCode)
    .then(data => {
      res.status(200).json(data);
    })
    .catch(error => {
      console.error(error);
      res.status(e.statusCode || 500).json(e);
    });
});

// Token Card

app.post(`/cardToken`, function(req,response) {

  const {sessionId, amount, cardData} = req.body
  const params = new URLSearchParams()

  params.append('cardNumber', cardData.cardNumber)
  params.append('cardBrand', cardData.cardBrand)
  params.append('cardCvv', cardData.cardCvv)
  params.append('cardExpirationMonth', cardData.cardExpirationMonth)
  params.append('cardExpirationYear', cardData.cardExpirationYear)

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

   axios.post(
  `https://df.uol.com.br/v2/cards?sessionId=${sessionId}&amount=${amount}`,
  params,
  config)
  .then(res => {

    return response.status(201).send(res.data)
  })
  .catch(err => {

    return response.status(400).send(err)
  })






}
)

app.get('/cardBrand', function(req,response) {
  const {sessionId, cardBin6Dig} = req.body


  axios.get
  (`https://df.uol.com.br/df-fe/mvc/creditcard/v1/getBin?tk=${sessionId}&creditCard=${cardBin6Dig}`)
  .then(res => {
    return response.status(201).send(res.data)
  })
  .catch(err => {
    console.log(err.response.data)
    return response.status(400).send(err.response.data)
  })

})

/**
 * Listen
 */
const host = '0.0.0.0'
app.listen(3333,host, function() {
  console.log("Example app listening on port 3333!");
});
