describe( 'Adding nested blocks', () => {
    before( () => {
        cy.newPost();
    } );

    it( 'Should insert column block and nested blocks', () => {
        const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

        // Use regular inserter to add column block
        cy.get( '.edit-post-header [aria-label="Add block"]' ).click();
        cy.get( '[placeholder="Search for a block"]' ).type( 'columns' );
        cy.get( '.editor-inserter__block' ).contains( 'Columns (Experimental)' ).click();
        cy.get( lastBlockSelector ).type("Paragraph block");

        // Insert a nested code block
        cy.get( '.layout-column-1 > .editor-block-list__block > :nth-child(2) > div > .components-button').click();
        cy.get( '[placeholder="Search for a block"]' ).type( 'code' );
        cy.get( '.editor-inserter__block' ).contains( 'Code' ).click();
        cy.get( lastBlockSelector ).type( 'Code block' );

        // Switch to Text Mode to check HTML Output
        cy.get( '.edit-post-ellipsis-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

        // Assertions
        cy.get( 'edit-post-text-editor' )
            .should( 'contain', 'Paragraph block' )
            .should( 'contain', 'Code block' );
    } );
} );
