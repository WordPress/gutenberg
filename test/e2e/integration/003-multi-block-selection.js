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
		// Using the placeholder
		cy.get( '[value="Write your story"]' ).click();
		cy.get( lastBlockSelector ).type( 'First Paragraph' );

		// Using the quick inserter
		cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
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
		// Mac uses meta modifier so we press both here
		cy.get( 'body' ).type( '{ctrl}a' );
		cy.get( 'body' ).type( '{meta}a' );

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
