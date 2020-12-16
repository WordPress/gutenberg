/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { gutterSize, verticalAlignment } = attributes;
	const blockProps = {
		className: classnames( {
			[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		} ),
		style: {
			'--columns-block-gutter-size':
				gutterSize !== undefined ? `${ gutterSize }px` : undefined,
		},
	};

	return (
		<div { ...useBlockProps.save( blockProps ) }>
			<InnerBlocks.Content />
		</div>
	);
}
