/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { destination, nofollow, title, opensInNewTab, label } = attributes;
	return (
		<>
			<a
				href={ destination }
				rel={ nofollow && 'nofollow' }
				title={ title }
				target={ opensInNewTab && '_blank' }
			>
				{ label }
			</a>
			<InnerBlocks.Content />
		</>
	);
}
