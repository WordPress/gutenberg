const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block visibility updates', () => {
	test.beforeEach( async ( { admin, page } ) => {
		// Record the updates sent to the store, through the Redux DevTools hook.
		await page.addInitScript( () => {
			window.visibilityUpdates = [];
			window.__REDUX_DEVTOOLS_EXTENSION__ =
				() =>
				( createStore ) =>
				( ...args ) => {
					const store = createStore( ...args );
					return {
						...store,
						dispatch( action ) {
							if ( action.type === 'SET_BLOCK_VISIBILITY' ) {
								window.visibilityUpdates.push( action.updates );
							}
							return store.dispatch( action );
						},
					};
				};
		} );
		await admin.createNewPost();
	} );

	test( 'should only send the blocks that changed', async ( {
		editor,
		page,
	} ) => {
		const lastUpdate = () =>
			page.evaluate( () => window.visibilityUpdates.at( -1 ) );
		const blockOrder = () =>
			page.evaluate( () =>
				window.wp.data.select( 'core/block-editor' ).getBlockOrder()
			);

		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'First' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second' );
		const [ , second ] = await blockOrder();
		await expect.poll( lastUpdate ).toMatchObject( { [ second ]: true } );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third' );
		const [ , , third ] = await blockOrder();
		await expect.poll( lastUpdate ).toEqual( { [ third ]: true } );
	} );
} );
