describe( 'Splitting and merging paragraph blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', () => {
		// Insert paragraph block and split using Enter
		cy.get( '.editor-default-block-appender' ).click();
		cy.get( '.mce-content-body' ).type( '{enter}' );

		// Assertion to check for two paragraph blocks
		cy.get( '.mce-content-body' ).should( ( $p ) => {
			expect( $p ).to.have.length( 2 );
		} );

		// Merge second paragraph block back into first using Backspace
		cy.get( '.mce-content-body:first' ).type( '{backspace}' );

		// Assertion to check for one paragraph block
		cy.get( '.mce-content-body' ).should( ( $p ) => {
			expect( $p ).to.have.length( 1 );
		} );
	} );
} );
