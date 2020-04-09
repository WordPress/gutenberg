const { login } = require( './login' );

const createNewPost = async () => {
	await login();

	await driver.get( 'http://localhost:8888/wp-admin/post-new.php' );
	await driver.wait(
		until.elementsLocated( By.className( 'edit-post-welcome-guide' ) )
	);
	await driver
		.actions()
		.sendKeys( Key.ESCAPE )
		.perform();
};

module.exports = {
	createNewPost,
};
