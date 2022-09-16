export default function save( { attributes } ) {
	const { type, label, inlineLabel } = attributes;

	return (
		<>
			{ type === 'textarea' && (
				<label>
					{ inlineLabel && label && <span>{ label }</span> }
					{ ! inlineLabel && label && <p>{ label }</p> }
					<textarea className="wp-block-input-field" />
				</label>
			) }

			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<input
							className="wp-block-button__link wp-element-button"
							type="submit"
							value={ label }
						/>
					</div>
				</div>
			) }

			{ type !== 'textarea' && type !== 'submit' && (
				<label>
					{ inlineLabel && label && <span>{ label }</span> }
					{ ! inlineLabel && label && <p>{ label }</p> }
					<input className="wp-block-input-field" type={ type } />
				</label>
			) }
		</>
	);
}
