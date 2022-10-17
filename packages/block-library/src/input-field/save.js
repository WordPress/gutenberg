/**
 * External dependencies
 */
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { type, name, label, inlineLabel } = attributes;

	return (
		<>
			{ type === 'textarea' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-input-field-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<div className="wp-block-input-field-label__content">
						{ label }
					</div>
					<textarea
						className="wp-block-input-field"
						name={ name || label }
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
					className={ classNames( 'wp-block-input-field-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<div className="wp-block-input-field-label__content">
						{ label }
					</div>
					<input
						className="wp-block-input-field"
						type={ type }
						name={ name || label }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }
		</>
	);
}
