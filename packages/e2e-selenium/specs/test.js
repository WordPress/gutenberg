it( 'Google title test', async () => {
	await driver.get( 'http://google.com' );
	await driver.findElement( By.name( 'q' ) ).sendKeys( 'BrowserStack\n' );

	const title = await driver.getTitle();

	expect( title ).toBe( 'BrowserStack - Google Search' );
} );
