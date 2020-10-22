/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { borderRadius, linkTarget, rel, text, title, url } = attributes;
	const buttonClasses = classnames( 'wp-block-button__link', {
		'no-border-radius': borderRadius === 0,
	} );
	const blockProps = useBlockProps.save();
	// Temporarily, we need to add the border radius to the blockProps so
	// that it is applied at the block level. This can be replaced by using
	// the border radius block support.
	blockProps.style = {
		...blockProps.style,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
	};

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
				value={ text }
				target={ linkTarget }
				rel={ rel }
			/>
		</div>
	);
}
