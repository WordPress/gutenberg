/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { borderRadius, linkTarget, rel, text, title, url } = attributes;

	const buttonClasses = classnames( 'wp-block-button__link', {
		'no-border-radius': borderRadius === 0,
	} );

	const buttonStyle = {
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
	};

	// The use of a `title` attribute here is soft-deprecated, but still applied
	// if it had already been assigned, for the sake of backward-compatibility.
	// A title will no longer be assigned for new or updated button block links.

	return (
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
	);
}
