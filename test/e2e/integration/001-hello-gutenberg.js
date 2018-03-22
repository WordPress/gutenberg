describe( 'Hello Gutenberg', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should show the New Post Page in Gutenberg', () => {
		// Assertions
		cy.url().should( 'include', 'post-new.php' );
		cy.get( '[placeholder="Add title"]' ).should( 'exist' );
	} );

	it( 'Should have no history', () => {
		cy.get( '.editor-history__undo:not( :disabled )' ).should( 'not.exist' );
		cy.get( '.editor-history__redo:not( :disabled )' ).should( 'not.exist' );
	} );

	it( 'Should not prompt to confirm unsaved changes', ( done ) => {
		const timeout = setTimeout( () => {
			done( new Error( 'Expected page reload' ) );
		}, 5000 );

		cy.window().then( ( window ) => {
			function verify( event ) {
				expect( event.returnValue ).to.equal( '' );

				window.removeEventListener( 'beforeunload', verify );
				clearTimeout( timeout );

				done();
			}

			window.addEventListener( 'beforeunload', verify );

			cy.reload();
		} );
	} );
} );
