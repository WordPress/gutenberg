/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment } = attributes;

	const wrapperClasses = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<div className={ wrapperClasses }>
			<InnerBlocks.Content />
		</div>
	);
}
