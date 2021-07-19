/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { isStackedOnMobile, verticalAlignment, columnMinWidth } = attributes;

	const className = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		[ `is-not-stacked-on-mobile` ]: ! isStackedOnMobile,
	} );

	const styles =
		columnMinWidth && isStackedOnMobile
			? `--wp--columns-min-width:${ columnMinWidth };`
			: null;

	return (
		<div { ...useBlockProps.save( { className } ) } style={ styles }>
			<InnerBlocks.Content />
		</div>
	);
}
