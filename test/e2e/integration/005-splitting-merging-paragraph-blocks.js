describe( 'Splitting and merging paragraph blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', () => {
		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

		// Insert paragraph block and split using Enter
		cy.get( '.editor-default-block-appender' ).click();
		cy.get( lastBlockSelector ).type( '{enter}' );

		// Assertion to check for two paragraph blocks
		cy.get( '.mce-content-body' ).should( ( $p ) => {
			expect( $p ).to.have.length( 2 );
		} );

		// Merge second paragraph block back into first using Backspace
		cy.get( lastBlockSelector ).type( '{backspace}' );

		// Assertion to check for one paragraph block
		cy.get( '.mce-content-body' ).should( ( $p ) => {
			expect( $p ).to.have.length( 1 );
		} );
	} );
} );
