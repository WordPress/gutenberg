/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

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
				name={ name || label }
				required={ required }
				aria-required={ required }
				placeholder={ placeholder || undefined }
				style={ inputStyle }
			/>
		</label>
	);
	/* eslint-enable jsx-a11y/label-has-associated-control */
}
