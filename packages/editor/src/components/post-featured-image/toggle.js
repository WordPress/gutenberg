/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function PostFeaturedImageToggle( { children, ...props } ) {
	return (
		<Button
			className="editor-post-featured-image__toggle"
			variant="tertiary"
			{ ...props }
		>
			{ children }
		</Button>
	);
}
