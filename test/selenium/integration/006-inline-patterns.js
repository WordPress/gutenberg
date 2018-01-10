const chai = require( 'chai' );
const { actionNewPost, getPostText, makeNewParagraph } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Inline patterns', () => {
		before( actionNewPost( config, driver ) );

		// sometimes a non-breaking space appears after the code block
		// but it is inconsistant varying with browser and timing
		const normalize = ( value ) => value.replace( /\u00A0/g, ' ' );

		it( 'Should convert text surrounded by backticks to an inline code block', function() {
			// Note that the short delays give TinyMCE and Gutenberg a chance to process events
			// otherwise sometimes problems occur like the pattern not being replaced 
			// or invisible zero width characters are left in the text
			makeNewParagraph( driver );
			driver.switchTo().activeElement().sendKeys( 'Before the `inline code' );
			driver.sleep( 50 );
			driver.switchTo().activeElement().sendKeys( '`' );
			driver.sleep( 50 );
			driver.switchTo().activeElement().sendKeys( ' and after' );
			driver.sleep( 50 );
			// Switch to Text Mode and back to check HTML Output
			getPostText( driver ).then( ( value ) => chai.expect( normalize( value ) ).to.equal(
				'<!-- wp:paragraph -->\n' +
				'<p>Before the <code>inline code</code> and after</p>\n' +
				'<!-- /wp:paragraph -->'
			) );
			return driver;
		} );
	} );
};
