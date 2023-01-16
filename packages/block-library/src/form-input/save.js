/**
 * External dependencies
 */
import classNames from 'classnames';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Get the name attribute from a content string.
 *
 * @param {string} content The block content.
 *
 * @return {string} Returns the slug.
 */
const getNameFromLabel = ( content ) => {
	const dummyElement = document.createElement( 'div' );
	dummyElement.innerHTML = content;
	// Get the slug.
	return (
		removeAccents( dummyElement.innerText )
			// Convert anything that's not a letter or number to a hyphen.
			.replace( /[^\p{L}\p{N}]+/gu, '-' )
			// Convert to lowercase
			.toLowerCase()
			// Remove any remaining leading or trailing hyphens.
			.replace( /(^-+)|(-+$)/g, '' )
	);
};

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel, required, placeholder } =
		attributes;

	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );

	const inputStyle = {
		...borderProps.style,
		...colorProps.style,
	};

	const inputClasses = classNames(
		'wp-block-form-input__input',
		colorProps.className,
		borderProps.className
	);
	const TagName = type === 'textarea' ? 'textarea' : 'input';

	/* eslint-disable jsx-a11y/label-has-associated-control */
	return (
		<label
			className={ classNames( 'wp-block-form-input__label', {
				'is-label-inline': inlineLabel,
			} ) }
		>
			<div className="wp-block-form-input__label-content">
				<RichText.Content value={ label } />
			</div>
			<TagName
				className={ inputClasses }
				type={ type }
				name={ name || getNameFromLabel( label ) }
				required={ required }
				aria-required={ required }
				placeholder={ placeholder || undefined }
				style={ inputStyle }
			/>
		</label>
	);
	/* eslint-enable jsx-a11y/label-has-associated-control */
}
