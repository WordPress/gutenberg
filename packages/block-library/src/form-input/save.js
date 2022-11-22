/**
 * External dependencies
 */
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel, required, placeholder } =
		attributes;

	const TagName = type === 'textarea' ? 'textarea' : 'input';

	return (
		<>
			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<button className="wp-block-button__link wp-element-button">
							{ label }
						</button>
					</div>
				</div>
			) }

			{ type !== 'submit' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-form-input-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<div className="wp-block-form-input-label__content">
						{ label }
					</div>
					<TagName
						className="wp-block-form-input"
						type={ type }
						name={ name || label }
						required={ required }
						aria-required={ required }
						placeholder={ placeholder || undefined }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }
		</>
	);
}
