import { speak } from '@wordpress/a11y';

speak( 'Loaded' );

export async function announce( message ) {
	const a11y = await import( '@wordpress/a11y' );
	a11y.speak( message );
}
