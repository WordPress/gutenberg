const { By, Key, until } = require( 'selenium-webdriver' );
const chai = require( 'chai' );
const { actionNewPost } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Autocomplete Users', function() {
		before( actionNewPost( config, driver ) );

		it( 'should autocomplete users with @', function() {
			driver.findElement( By.css( '.editor-default-block-appender' ) ).click();
			driver.switchTo().activeElement().sendKeys( '@' );
			driver.wait( until.elementLocated( By.css( '.blocks-autocompleters__user' ) ), 1000 );
			driver.switchTo().activeElement().sendKeys( Key.ENTER );
			driver.wait( driver.findElements( By.css( '.blocks-autocompleters__user' ) ).
				then( ( elements ) => elements.length === 0 ), 1000 );
			driver.findElement( By.css( 'p.wp-block-paragraph > a[href]' ) ).
				getText().then( ( text ) => chai.expect( text ).to.match( /^@/ ) );
			return driver;
		} );
	} );
};
