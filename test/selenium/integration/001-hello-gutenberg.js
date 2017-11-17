const { By } = require( 'selenium-webdriver' );
const { actionNewPost } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Hello Gutenberg', () => {
		before( actionNewPost( config, driver ) );

		it( 'Should show the New Post Page in Gutenberg', function() {
			driver.findElement( By.css( '[placeholder="Add title"]' ) );
			driver.findElement( By.css( '[value="Write your story"]' ) );
			return driver;
		} );
	} );
};
