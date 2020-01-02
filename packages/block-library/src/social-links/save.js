/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import classnames from 'classnames';

export default function save( { attributes, className } ) {
	const { itemsJustification } = attributes;

	const blockClassNames = classnames( className, {
		[ `items-justified-${ itemsJustification }` ]: itemsJustification,
	} );

	return (
		<ul className={ blockClassNames }>
			<InnerBlocks.Content />
		</ul>
	);
}
