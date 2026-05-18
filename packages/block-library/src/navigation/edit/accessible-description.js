/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/ui';

export default function AccessibleDescription( { id, children } ) {
	return (
		<VisuallyHidden>
			<div id={ id } className="wp-block-navigation__description">
				{ children }
			</div>
		</VisuallyHidden>
	);
}
