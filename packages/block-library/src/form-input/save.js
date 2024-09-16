/**
 * External dependencies
 */
import clsx from 'clsx';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Get the name attribute from a content string.
 *
 * @param {string} content The block content.
 *
 * @return {string} Returns the slug.
 */
const getNameFromLabel = ( content ) => {
	return (
		removeAccents( stripHTML( content ) )
			// Convert anything that's not a letter or number to a hyphen.
			.replace( /[^\p{L}\p{N}]+/gu, '-' )
			// Convert to lowercase
			.toLowerCase()
			// Remove any remaining leading or trailing hyphens.
			.replace( /(^-+)|(-+$)/g, '' )
	);
};

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel, required, placeholder, value } =
		attributes;

	const borderProps = getBorderClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );

	const inputStyle = {
		...borderProps.style,
		...colorProps.style,
	};

	const inputClasses = clsx(
		'wp-block-form-input__input',
		colorProps.className,
		borderProps.className
	);
	const TagName = type === 'textarea' ? 'textarea' : 'input';

	const blockProps = useBlockProps.save();

	// Note: radio inputs aren't implemented yet.
	const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';

	if ( 'hidden' === type ) {
		return <input type={ type } name={ name } value={ value } />;
	}

	return (
		<div { ...blockProps }>
			{ /* eslint-disable jsx-a11y/label-has-associated-control */ }
			<label
				className={ clsx( 'wp-block-form-input__label', {
					'is-label-inline': inlineLabel,
				} ) }
			>
				{ ! isCheckboxOrRadio && (
					<span className="wp-block-form-input__label-content">
						<RichText.Content value={ label } />
					</span>
				) }
				<TagName
					className={ inputClasses }
					type={ 'textarea' === type ? undefined : type }
					name={ name || getNameFromLabel( label ) }
					required={ required }
					aria-required={ required }
					placeholder={ placeholder || undefined }
					style={ inputStyle }
				/>
				{ isCheckboxOrRadio && (
					<span className="wp-block-form-input__label-content">
						<RichText.Content value={ label } />
					</span>
				) }
			</label>
			{ /* eslint-enable jsx-a11y/label-has-associated-control */ }
		</div>
	);
}
