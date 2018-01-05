const chai = require( 'chai' );
const { actionNewPost, getPostText, makeNewParagraph } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Inline patterns', () => {
		before( actionNewPost( config, driver ) );

		it( 'Should convert text surrounded by backticks to an inline code block', function() {
			// Note that the short delays give TinyMCE and Gutenberg a chance to process events
			// otherwise sometimes problems occur like the pattern not being replaced 
			// or invisible zero width characters are left in the text
			makeNewParagraph( driver );
			driver.switchTo().activeElement().sendKeys( 'Before the inline code block `inline code block' );
			driver.sleep( 50 );
			driver.switchTo().activeElement().sendKeys( '`' );
			driver.sleep( 50 );
			driver.switchTo().activeElement().sendKeys( ' after the inline code block' );
			driver.sleep( 50 );
			// Switch to Text Mode and back to check HTML Output
			getPostText( driver ).then( ( value ) => chai.expect( value ).to.equal(
				'<!-- wp:paragraph -->\n' +
				'<p>Before the inline code block <code>inline code block</code> after the inline code block</p>\n' +
				'<!-- /wp:paragraph -->'
			) );
			return driver;
		} );
	} );
};
