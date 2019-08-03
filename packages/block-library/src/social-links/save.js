/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { columns, verticalAlignment } = attributes;

	const wrapperClasses = classnames( `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<div className={ wrapperClasses }>
			<InnerBlocks.Content />
		</div>
	);
}
