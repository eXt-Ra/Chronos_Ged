import nodemailer from 'nodemailer';

const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
	user: 'dealtis.ged@gmail.com',
	pass: 'fhL-R4L-mVm-NPc'
  }
};

let transporter = nodemailer.createTransport(smtpConfig);

function start() {
  transporter.verify(function (error, success) {
	if (error) {
	  console.log(error);
	} else {
	  console.log('(▀¯▀) MAIL SERVER START (▀¯▀)');
	}
  });
};

function sendMail(mail) {
  return new Promise((resolve, reject) => {
	transporter.sendMail(mail, (err, info) => {
	  if (err) {
		reject(err);
	  } else {
		resolve(info);
	  }
	});
  });
};

export {start, sendMail};
