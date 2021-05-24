/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		gridGap,
		gridGapUnit,
		gridTemplateColumns,
		verticalAlignment,
	} = attributes;

	const className = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const gridGapValue = gridGapUnit ? `${ gridGap }${ gridGapUnit }` : gridGap;

	const style = {
		gap: gridGapValue || undefined,
		gridTemplateColumns,
	};

	return (
		<div { ...useBlockProps.save( { className, style } ) }>
			<InnerBlocks.Content />
		</div>
	);
}
