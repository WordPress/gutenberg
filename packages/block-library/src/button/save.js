/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import getColorAndStyleProps from './color-props';

export default function save( { attributes } ) {
	const { borderRadius, linkTarget, rel, text, title, url } = attributes;
	const colorProps = getColorAndStyleProps( attributes );
	const buttonClasses = classnames(
		'wp-block-button__link',
		colorProps.className,
		{
			'no-border-radius': borderRadius === 0,
		}
	);
	const buttonStyle = {
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		...colorProps.style,
	};

	const blockProps = useBlockProps.save();
	// Remove colorProps from style so that they are not applied to the button's
	// wrapper
	for ( const key of Object.keys( colorProps.style ) ) {
		delete blockProps.style[ key ];
	}

	// The use of a `title` attribute here is soft-deprecated, but still applied
	// if it had already been assigned, for the sake of backward-compatibility.
	// A title will no longer be assigned for new or updated button block links.

	return (
		<div { ...blockProps }>
			<RichText.Content
				tagName="a"
				className={ buttonClasses }
				href={ url }
				title={ title }
				style={ buttonStyle }
				value={ text }
				target={ linkTarget }
				rel={ rel }
			/>
		</div>
	);
}
