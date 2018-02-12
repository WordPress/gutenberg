describe( 'Multi-block selection', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should select/unselect multiple blocks', () => {
		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';
		const firstBlockContainerSelector = '.editor-block-list__block:first';
		const lastBlockContainerSelector = '.editor-block-list__block:last';
		const multiSelectedCssClass = 'is-multi-selected';

		// Creating test blocks
		cy.get( '.editor-default-block-appender' ).click();
		cy.get( lastBlockSelector ).type( 'First Paragraph' );
		cy.get( '.edit-post-header [aria-label="Add block"]' ).click();
		cy.get( '[placeholder="Search for a block"]' ).type( 'Paragraph' );
		cy.get( '.editor-inserter__block' ).contains( 'Paragraph' ).click();
		cy.get( lastBlockSelector ).type( 'Second Paragraph' );

		// Default: No selection
		cy.get( firstBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );
		cy.get( lastBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );

		// Multiselect via Shift + click
		cy.get( firstBlockContainerSelector ).click();
		cy.get( 'body' ).type( '{shift}', { release: false } );
		cy.get( lastBlockContainerSelector ).click();

		// Verify selection
		cy.get( firstBlockContainerSelector ).should( 'have.class', multiSelectedCssClass );
		cy.get( lastBlockContainerSelector ).should( 'have.class', multiSelectedCssClass );

		// Unselect
		cy.get( 'body' ).type( '{shift}' ); // releasing shift
		cy.get( lastBlockContainerSelector ).click();

		// No selection
		cy.get( firstBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );
		cy.get( lastBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );

		// Multiselect via keyboard
		const isMacOs = Cypress.platform === 'darwin';
		if ( isMacOs ) {
			cy.get( 'body' ).type( '{meta}a' );
		} else {
			cy.get( 'body' ).type( '{ctrl}a' );
		}

		// Verify selection
		cy.get( firstBlockContainerSelector ).should( 'have.class', multiSelectedCssClass );
		cy.get( lastBlockContainerSelector ).should( 'have.class', multiSelectedCssClass );

		// Unselect
		cy.get( 'body' ).type( '{esc}' );

		// No selection
		cy.get( firstBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );
		cy.get( lastBlockContainerSelector ).should( 'not.have.class', multiSelectedCssClass );
	} );
} );
