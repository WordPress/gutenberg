const { By, Key } = require( 'selenium-webdriver' );
const chai = require( 'chai' );
const { actionNewPost, findBlockByIndex } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Multi-block selection', () => {
		before( actionNewPost( config, driver ) );

		it( 'Should select/unselect multiple blocks', function() {
			if ( config.browser === 'firefox' ) {
				// Currently Selenium can't make Firefox do Shift+Click or Ctrl+a
				// because Firefox has decided to implement the W3C webdriver standard
				// and not implement the Selenium defacto standard. Apparently Selenium
				// won't be able to support this until version 4.
				this.skip();
				return;
			}
			// selection test helpers
			const selectionRe = /\bis-multi-selected\b/;
			const expectBlockNotSelected = ( block ) => block.getAttribute( 'class' ).then(
				( className ) => chai.expect( className ).to.not.match( selectionRe ) );
			const expectBlockSelected = ( block ) => block.getAttribute( 'class' ).then(
				( className ) => chai.expect( className ).to.match( selectionRe ) );

			// Creating test blocks x 3
			driver.findElement( By.css( '[value="Write your story"]' ) ).click();
			driver.switchTo().activeElement().sendKeys( 'First Paragraph', Key.ENTER );
			driver.switchTo().activeElement().sendKeys( 'Second Paragraph', Key.ENTER );
			driver.switchTo().activeElement().sendKeys( 'Third Paragraph' );

			// Default: No selection
			driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
				chai.expect( blocks.length ).to.equal( 3 );
				expectBlockNotSelected( blocks[ 0 ] );
				expectBlockNotSelected( blocks[ 1 ] );
				expectBlockNotSelected( blocks[ 2 ] );
			} );

			// Multiselect via Shift + click
			findBlockByIndex( driver, 0 ).click();
			driver.actions().keyDown( Key.SHIFT ).click( findBlockByIndex( driver, 1 ) ).keyUp( Key.SHIFT ).perform();

			// Verify selection
			driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
				chai.expect( blocks.length ).to.equal( 3 );
				expectBlockSelected( blocks[ 0 ] );
				expectBlockSelected( blocks[ 1 ] );
				expectBlockNotSelected( blocks[ 2 ] );
			} );

			// Unselect
			findBlockByIndex( driver, 1 ).click();

			// No selection
			driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
				chai.expect( blocks.length ).to.equal( 3 );
				expectBlockNotSelected( blocks[ 0 ] );
				expectBlockNotSelected( blocks[ 1 ] );
				expectBlockNotSelected( blocks[ 2 ] );
			} );

			// Multiselect via keyboard
			// Mac uses meta modifier so we press both here
			driver.findElement( By.css( 'body' ) ).sendKeys( Key.CONTROL, 'a' );
			driver.findElement( By.css( 'body' ) ).sendKeys( Key.COMMAND, 'a' );

			// Verify selection
			driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
				chai.expect( blocks.length ).to.equal( 3 );
				expectBlockSelected( blocks[ 0 ] );
				expectBlockSelected( blocks[ 1 ] );
				expectBlockSelected( blocks[ 1 ] );
			} );

			// Unselect
			driver.findElement( By.css( 'body' ) ).sendKeys( Key.ESCAPE );

			// No selection
			driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
				chai.expect( blocks.length ).to.equal( 3 );
				expectBlockNotSelected( blocks[ 0 ] );
				expectBlockNotSelected( blocks[ 1 ] );
				expectBlockNotSelected( blocks[ 2 ] );
			} );

			return driver;
		} );
	} );
};
