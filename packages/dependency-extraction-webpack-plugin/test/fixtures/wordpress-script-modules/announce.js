export async function announce( message ) {
	const { speak } = await import( '@wordpress/a11y' );
	speak( message );
}
