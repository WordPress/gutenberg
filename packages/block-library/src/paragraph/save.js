/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { isRTL } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { content, dropCap, direction, style } = attributes;
	const textAlign = style?.typography?.textAlign;
	const className = clsx( {
		'has-drop-cap':
			textAlign === ( isRTL() ? 'left' : 'right' ) ||
			textAlign === 'center'
				? false
				: dropCap,
	} );

	return (
		<p { ...useBlockProps.save( { className, dir: direction } ) }>
			<RichText.Content value={ content } />
		</p>
	);
}
