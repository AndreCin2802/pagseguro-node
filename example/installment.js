const pagseguro = require('../src')
const config = require('./config_sample')

const client = pagseguro.connect(config)

	const query = {
		'amount': 30.00,
		'cardBrand': 'visa',
		'maxInstallmentNoInterest': 12
	}

client.installment.get(query)
    .then(data => console.log(data))
    .catch(error => console.error(error))
