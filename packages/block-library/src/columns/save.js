/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment, displayAsGrid, gridColumnMinWidth } = attributes;

	const className = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		'display-as-grid': displayAsGrid,
	} );

	let style;

	if ( gridColumnMinWidth && displayAsGrid ) {
		// Numbers are handled for backward compatibility as they can be still provided with templates.
		style = {
			gridTemplateColumns: `repeat(auto-fill, minmax(${ gridColumnMinWidth }, 1fr))`,
		};
	}

	return (
		<div { ...useBlockProps.save( { className, style } ) }>
			<InnerBlocks.Content />
		</div>
	);
}
