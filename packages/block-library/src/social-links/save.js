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
			customIconBackgroundColor,
			customIconColor,
			iconBackgroundColor,
			iconColor,
			size,
		},
	} = props;

	const className = classNames( size, {
		'has-icon-color': iconColor || customIconColor,
		'has-icon-background-color':
			iconBackgroundColor || customIconBackgroundColor,
	} );

	return (
		<ul { ...useBlockProps.save( { className } ) }>
			<InnerBlocks.Content />
		</ul>
	);
}
