/**
 * External dependencies
 */
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel, required } = attributes;

	return (
		<>
			{ type === 'textarea' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-form-input-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<div className="wp-block-form-input-label__content">
						{ label }
					</div>
					<textarea
						className="wp-block-form-input"
						name={ name || label }
						required={ required }
						aria-required={ required }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }

			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<button className="wp-block-button__link wp-element-button">
							{ label }
						</button>
					</div>
				</div>
			) }

			{ type !== 'textarea' && type !== 'submit' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-form-input-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<div className="wp-block-form-input-label__content">
						{ label }
					</div>
					<input
						className="wp-block-form-input"
						type={ type }
						name={ name || label }
						required={ required }
						aria-required={ required }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }
		</>
	);
}
