const { By, Key, promise, until } = require( 'selenium-webdriver' );
const chai = require( 'chai' );
const { actionNewPost, findElementWithText } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Creating blocks', () => {
		before( actionNewPost( config, driver ) );

		it( 'should be able to create all blocks', function() {
			this.timeout( 60000 );
			// list of blocks that are tested elsewhere and should be skipped
			const ignoreBlocks = [ 'Paragraph', 'Code', 'Quote' ];
			// open the inserter menu
			driver.findElement( By.css( '.editor-header [aria-label="Insert block"]' ) ).click();
			driver.wait( until.elementLocated( By.css( '[placeholder="Search for a block"]' ) ), 1000 );
			// click the blocks tab
			findElementWithText( driver, 'button.editor-inserter__tab', 'Blocks' ).click();
			// get a list of all the blocks
			const blockTitles = promise.filter( driver.findElements( By.css( 'button.editor-inserter__block[role="menuitem"]' ) ).then( ( buttons ) => {
				return promise.map( buttons, ( button ) => button.getText() );
			} ), ( title ) => ignoreBlocks.indexOf( title ) === -1 );
			// close the menu
			driver.switchTo().activeElement().sendKeys( Key.ESCAPE );
			// generate tests
			return promise.map( blockTitles, ( title ) => {
				// count the number of blocks
				const blockCountBefore = driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => blocks.length );
				// open the inserter menu
				driver.findElement( By.css( '.editor-header [aria-label="Insert block"]' ) ).click();
				driver.wait( until.elementLocated( By.css( '[placeholder="Search for a block"]' ) ), 1000 );
				// search for the block
				driver.switchTo().activeElement().sendKeys( title );
				// click the button to insert it
				findElementWithText( driver, 'button.editor-inserter__block[role="menuitem"]', title ).click();
				// check that there is now one more block
				const blockCountAfter = driver.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => blocks.length );
				return promise.all( [ blockCountBefore, blockCountAfter ] ).then(
					( counts ) => chai.expect( counts[ 0 ] + 1 ).to.eq( counts[ 1 ] ) );
			} );
		} );
	} );
};
