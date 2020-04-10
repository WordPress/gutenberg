const { createNewPost } = require( '../../util' );

it( 'can press enter key to enter into the edit mode', async () => {
	await createNewPost();

	// Find text area and click it.
	await driver
		.findElement(
			By.className( 'block-editor-default-block-appender__content' )
		)
		.click();

	// Input text for test.
	await driver
		.findElement( By.className( 'block-editor-block-list__block' ) )
		.sendKeys( 'some text to test' );

	// Step out to select mode.
	await driver
		.actions()
		.sendKeys( Key.ESCAPE )
		.perform();
	await driver.wait(
		until.elementsLocated( By.css( '[aria-label^="Paragraph Block."]' ) )
	);

	// Enter into edit mode with Enter key.
	await driver
		.actions()
		.sendKeys( Key.ENTER )
		.perform();

	// If an unexpected error is thrown, the below cannot pass.
	const text = await driver
		.findElement( By.className( 'block-editor-block-list__block' ) )
		.getText();

	expect( text ).toContain( 'some text to test' );
} );
