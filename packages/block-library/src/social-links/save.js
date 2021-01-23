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
		attributes: { iconBackgroundColorValue, iconColorValue, size },
	} = props;

	const className = classNames( size, {
		'has-icon-color': iconColorValue,
		'has-icon-background-color': iconBackgroundColorValue,
	} );

	const style = {
		'--wp--social-links--icon-color': iconColorValue,
		'--wp--social-links--icon-background-color': iconBackgroundColorValue,
	};

	return (
		<ul { ...useBlockProps.save( { className, style } ) }>
			<InnerBlocks.Content />
		</ul>
	);
}
