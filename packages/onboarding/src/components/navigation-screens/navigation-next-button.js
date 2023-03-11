/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function NavigationNextButton( { onClick, children } ) {
	return (
		<Button variant="primary" onClick={ onClick }>
			{ children }
		</Button>
	);
}
