it( 'Google title test', async () => {
	await driver.get( 'http://google.com' );
	await driver.findElement( By.name( 'q' ) ).sendKeys( 'BrowserStack\n' );
	await driver.wait( until.titleContains( 'Google Search' ) );

	const title = await driver.getTitle();

	expect( title ).toBe( 'BrowserStack - Google Search' );
} );

it( 'Gutenberg test', async () => {
	await driver.get( 'http://localhost:8888/' );
	const div = await driver.findElement( By.className( 'site-title' ) );

	const text = await div.getText();

	expect( text ).toBe( 'gutenberg' );
} );
