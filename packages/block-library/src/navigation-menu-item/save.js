/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<>
			<a
				href={ attributes.destination }
				rel={ attributes.nofollow && 'nofollow' }
				title={ attributes.title }
				target={ attributes.opensInNewTab && '_blank' }
			>
				{ attributes.label }
			</a>
			<InnerBlocks.Content />
		</>
	);
}
