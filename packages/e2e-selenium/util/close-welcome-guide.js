const { login } = require( './login' );
const { createNewPost } = require( './create-new-post' );

const closeWelcomeGuide = async () => {
	await login();

	await createNewPost();

	await driver.wait(
		until.elementsLocated( By.className( 'edit-post-welcome-guide' ) )
	);
	await driver
		.actions()
		.sendKeys( Key.ESCAPE )
		.perform();
};

module.exports = {
	closeWelcomeGuide,
};
