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
		attributes: {
			iconBackgroundColorValue,
			iconColorValue,
			itemsJustification,
			size,
		},
	} = props;

	const className = classNames( size, {
		'has-icon-color': iconColorValue,
		'has-icon-background-color': iconBackgroundColorValue,
		[ `items-justified-${ itemsJustification }` ]: itemsJustification,
	} );

	return (
		<ul { ...useBlockProps.save( { className } ) }>
			<InnerBlocks.Content />
		</ul>
	);
}
