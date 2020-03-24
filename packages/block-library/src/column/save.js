/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment, width } = attributes;

	const wrapperClasses = classnames( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	let style;
	if ( Number.isFinite( width ) ) {
		style = { flexBasis: width + '%' };
	}

	return (
		<Block.Save.div className={ wrapperClasses } style={ style }>
			<InnerBlocks.Content />
		</Block.Save.div>
	);
}
