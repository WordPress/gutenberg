const { By, Key } = require( 'selenium-webdriver' );
const chai = require( 'chai' );
const { newPost, findBlockByIndex, findElementWithTextMatchingRe, makeNewParagraph } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Managing links', () => {
		before( function() {
			// the initial load after server start can be slow
			// so a 5 second timeout is too small
			this.timeout( 10000 );
			newPost( config, driver );
			makeNewParagraph( driver );
			return driver;
		} );

		const setFixedToolbar = ( b ) => {
			const menuButton = driver.findElement( By.css( '.editor-ellipsis-menu [aria-label="More"]' ) );
			menuButton.click();
			const menuItem = findElementWithTextMatchingRe( driver, '.components-choice-menu button.components-menu-items__toggle', /^Fix toolbar to top/ );
			menuItem.getAttribute( 'class' ).then( ( className ) => {
				const fixedIsOn = /\bis-selected\b/.test( className );
				( fixedIsOn === b ? menuButton : menuItem ).click();
			} );
		};

		it( 'Pressing Left and Esc in Link Dialog in "Fixed to Toolbar" mode', function() {
			setFixedToolbar( true );
			findBlockByIndex( driver, 0 ).click();
			driver.findElement( By.css( 'button[aria-label="Link"]' ) ).click();

			// Typing "left" should not close the dialog
			driver.switchTo().activeElement().sendKeys( Key.ARROW_LEFT );
			driver.findElement( By.css( '.blocks-format-toolbar__link-modal' ) ).isDisplayed();

			// Escape should close the dialog still.
			driver.switchTo().activeElement().sendKeys( Key.ESCAPE );
			driver.findElements( By.css( '.blocks-format-toolbar__link-modal' ) ).then(
				( candidates ) => chai.expect( candidates.length ).to.equal( 0 ) );
			return driver;
		} );

		it( 'Pressing Left and Esc in Link Dialog in "Docked Toolbar" mode', function() {
			setFixedToolbar( false );
			findBlockByIndex( driver, 0 ).click();
			driver.findElement( By.css( 'button[aria-label="Link"]' ) ).click();

			// Typing "left" should not close the dialog
			driver.switchTo().activeElement().sendKeys( Key.ARROW_LEFT );
			driver.findElement( By.css( '.blocks-format-toolbar__link-modal' ) ).isDisplayed();

			// Escape should close the dialog still.
			driver.switchTo().activeElement().sendKeys( Key.ESCAPE );
			driver.findElements( By.css( '.blocks-format-toolbar__link-modal' ) ).then(
				( candidates ) => chai.expect( candidates.length ).to.equal( 0 ) );
			return driver;
		} );
	} );
};
