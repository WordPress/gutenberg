const { By, Key, until } = require( 'selenium-webdriver' );
const chai = require( 'chai' );
const { actionNewPost, findBlockByIndex, findElementWithText, getPostText } = require( '../commands.js' );
module.exports.run = ( config, driver ) => {
	describe( 'Adding blocks', () => {
		before( actionNewPost( config, driver ) );

		it( 'Should insert content using the placeholder, the quick inserter, the regular inserter', function() {
			// Using the placeholder
			driver.findElement( By.css( '.editor-default-block-appender' ) ).click();
			driver.switchTo().activeElement().sendKeys( 'First Paragraph' );
			const first = findBlockByIndex( driver, 0 );
			first.getAttribute( 'data-type' ).then( ( type ) => chai.expect( type ).to.equal( 'core/paragraph' ) );
			first.getText().then( ( text ) => chai.expect( text ).to.equal( 'First Paragraph' ) );

			// Using the quick inserter
			driver.findElement( By.css( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ) ).click();
			driver.switchTo().activeElement().sendKeys( 'Second Paragraph' );
			const second = findBlockByIndex( driver, 1 );
			second.getAttribute( 'data-type' ).then( ( type ) => chai.expect( type ).to.equal( 'core/paragraph' ) );
			second.getText().then( ( text ) => chai.expect( text ).to.equal( 'Second Paragraph' ) );

			// Using the slash command
			driver.switchTo().activeElement().sendKeys( Key.ENTER );
			driver.switchTo().activeElement().sendKeys( '/quote' );
			driver.wait( until.elementLocated( By.css( '.blocks-autocompleters__block' ) ), 1000 );
			driver.switchTo().activeElement().sendKeys( Key.ENTER );
			driver.switchTo().activeElement().sendKeys( 'The quotation', Key.TAB, 'The citation' );
			const third = findBlockByIndex( driver, 2 );
			third.getAttribute( 'data-type' ).then( ( type ) => chai.expect( type ).to.equal( 'core/quote' ) );
			third.findElement( By.css( 'p' ) ).getText().then( ( text ) => chai.expect( text ).to.equal( 'The quotation' ) );
			third.findElement( By.css( 'cite' ) ).getText().then( ( text ) => chai.expect( text ).to.equal( 'The citation' ) );

			// Using the regular inserter
			driver.findElement( By.css( '.editor-header [aria-label="Insert block"]' ) ).click();
			driver.wait( until.elementLocated( By.css( '[placeholder="Search for a block"]' ) ), 1000 );
			driver.switchTo().activeElement().sendKeys( 'code' );
			findElementWithText( driver, 'button.editor-inserter__block', 'Code' ).click();
			// note that the code block does not automatically get focus so we have to select it
			driver.findElement( By.css( '[placeholder="Write code…"]' ) ).click();
			driver.switchTo().activeElement().sendKeys( 'Code block' );
			const forth = findBlockByIndex( driver, 3 );
			forth.getAttribute( 'data-type' ).then( ( type ) => chai.expect( type ).to.equal( 'core/code' ) );
			forth.getText().then( ( text ) => chai.expect( text ).to.equal( 'Code block' ) );

			// Switch to Text Mode and back to check HTML Output
			getPostText( driver ).then( ( value ) => chai.expect( value ).to.equal(
				'<!-- wp:paragraph -->\n' +
				'<p>First Paragraph</p>\n' +
				'<!-- /wp:paragraph -->\n' +
				'\n' +
				'<!-- wp:paragraph -->\n' +
				'<p>Second Paragraph</p>\n' +
				'<!-- /wp:paragraph -->\n' +
				'\n' +
				'<!-- wp:quote -->\n' +
				'<blockquote class="wp-block-quote">\n' +
				'    <p>The quotation</p><cite>The citation</cite>' +
				'</blockquote>\n' +
				'<!-- /wp:quote -->\n' +
				'\n' +
				'<!-- wp:code -->\n' +
				'<pre class="wp-block-code"><code>Code block</code></pre>\n' +
				'<!-- /wp:code -->'
			) );
			return driver;
		} );
	} );
};
