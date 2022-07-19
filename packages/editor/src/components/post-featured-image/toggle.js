/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function PostFeaturedImageToggle( {
	menuAnchorRef,
	children,
	...props
} ) {
	return (
		<Button
			ref={ menuAnchorRef }
			className="editor-post-featured-image__toggle"
			variant="tertiary"
			{ ...props }
		>
			{ children }
		</Button>
	);
}
