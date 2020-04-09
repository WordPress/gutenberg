const login = async () => {
	await driver.get( 'http://localhost:8888/wp-login.php' );

	await driver.findElement( By.id( 'user_login' ) ).sendKeys( 'admin' );
	await driver.findElement( By.id( 'user_pass' ) ).sendKeys( 'password' );
	await driver.findElement( By.id( 'wp-submit' ) ).click();

	await driver.wait( until.elementsLocated( By.id( 'wpadminbar' ) ), 15000 );
};

module.exports = {
	login,
};
