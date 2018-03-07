describe( 'Adding blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should insert content using the placeholder and the regular inserter', () => {
		const lastBlockSelector = '.editor-block-list__block-edit:last';

		// Using the placeholder
		cy.get( '.editor-default-block-appender' ).click();
		cy.focused().type( 'Paragraph block' );

		// Default block appender is provisional
		cy.get( lastBlockSelector ).then( ( firstBlock ) => {
			cy.get( '.editor-default-block-appender' ).click();
			cy.get( '.edit-post-visual-editor' ).click();
			cy.get( lastBlockSelector ).should( 'have.text', firstBlock.text() );
		} );

		// Using the slash command
		// TODO: Test omitted because Cypress doesn't update the selection
		// object properly, so the slash inserter is not showing up.

		// Using the regular inserter
		cy.get( '.edit-post-header [aria-label="Add block"]' ).click();
		cy.get( '[placeholder="Search for a block"]' ).type( 'code' );
		cy.get( '.editor-inserter__block' ).contains( 'Code' ).click();
		cy.get( '[placeholder="Write code…"]' ).type( 'Code block' );

		// Using the between inserter
		cy.document().trigger( 'mousemove', { clientX: 200, clientY: 300 } );
		cy.document().trigger( 'mousemove', { clientX: 250, clientY: 350 } );
		cy.get( '[data-type="core/paragraph"] .editor-block-list__insertion-point-inserter' ).click();
		cy.focused().type( 'Second paragraph' );

		// Switch to Text Mode to check HTML Output
		cy.get( '.edit-post-more-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

		// Assertions
		cy.get( '.editor-post-text-editor' ).should( 'have.value', [
			'<!-- wp:paragraph -->',
			'<p>Paragraph block</p>',
			'<!-- /wp:paragraph -->',
			'',
			'<!-- wp:paragraph -->',
			'<p>Second paragraph</p>',
			'<!-- /wp:paragraph -->',
			'',
			'<!-- wp:code -->',
			'<pre class="wp-block-code"><code>Code block</code></pre>',
			'<!-- /wp:code -->',
		].join( '\n' ) );
	} );
} );
