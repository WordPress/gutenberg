/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
} from '@wordpress/block-editor';

export default function save( { attributes/*, innerBlocks*/ } ) {
	const { destination, nofollow, title, opensInNewTab, label } = attributes;
	return (
		<li>
			<a
				href={ destination }
				rel={ nofollow ? 'nofollow' : undefined }
				title={ title }
				target={ opensInNewTab ? '_blank' : undefined }
				className="wp-block-navigation-menu-item"
			>
				{ label }
			</a>
			<ul>
				<InnerBlocks.Content />
			</ul>

			{ /* This should make the HTML look the same but it invalidates the block */ }

			{ /* ( innerBlocks.length > 0 ) && <ul>
				<InnerBlocks.Content />
			</ul> */ }
		</li>
	);
}
