/**
 * External dependencies
 */
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel, required, placeholder } =
		attributes;

	const TagName = type === 'textarea' ? 'textarea' : 'input';

	/* eslint-disable jsx-a11y/label-has-associated-control */
	return (
		<label
			className={ classNames( 'wp-block-form-input-label', {
				'is-label-inline': inlineLabel,
			} ) }
		>
			<div className="wp-block-form-input-label__content">{ label }</div>
			<TagName
				className="wp-block-form-input"
				type={ type }
				name={ name || label }
				required={ required }
				aria-required={ required }
				placeholder={ placeholder || undefined }
			/>
		</label>
	);
	/* eslint-enable jsx-a11y/label-has-associated-control */
}
