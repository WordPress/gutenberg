/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( props ) {
	const {
		attributes: { backgroundColor, textColor, itemsJustification, size },
	} = props;

	const className = classNames( size, {
		'has-color': textColor,
		'has-background-color': backgroundColor,
		[ `items-justified-${ itemsJustification }` ]: itemsJustification,
	} );

	return (
		<ul { ...useBlockProps.save( { className } ) }>
			<InnerBlocks.Content />
		</ul>
	);
}
