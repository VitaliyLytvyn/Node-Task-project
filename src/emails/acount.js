const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'some@some.net',
        subject: 'Welcome message',
        text: `hello ${name}, welcome on board!`
    };
    sgMail.send(msg);
}

const cancelEmail = (email, name) => {
    const msg = {
        to: email,
        from: 'some@some.net',
        subject: 'Cancelation message',
        text: `hello ${name}, your account was deleted!`
    };
    sgMail.send(msg);

    console.log('Cancel email to: ', msg.to," of ", name)
}

module.exports = {
    sendWelcomeEmail,
    cancelEmail
}