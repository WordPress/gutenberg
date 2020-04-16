/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { inheritColors } = attributes;

	const className = classnames( className, {
		'has-inherited-color': inheritColors,
	} );

	return (
		<ul className={ className }>
			<InnerBlocks.Content />
		</ul>
	);
}
