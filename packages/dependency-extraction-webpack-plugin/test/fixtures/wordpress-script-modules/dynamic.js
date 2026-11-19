export async function navigate( url ) {
	const { store } = await import( '@wordpress/interactivity' );
	const { actions } = await import( '@wordpress/interactivity-router' );
	const { speak } = await import( '@wordpress/a11y' );

	store( 'dynamic', {} );
	await actions.navigate( url );
	speak( 'Navigated' );
}
