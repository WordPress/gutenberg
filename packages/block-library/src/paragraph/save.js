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
	const { align, content, dropCap, direction } = attributes;
	const className = clsx( {
		'has-drop-cap':
			align === ( isRTL() ? 'left' : 'right' ) || align === 'center'
				? false
				: dropCap,
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<p { ...useBlockProps.save( { className, dir: direction } ) }>
			<RichText.Content value={ content } />
		</p>
	);
}
