export default function AccessibleDescription( { id, content } ) {
	return (
		<div
			id={ id }
			className="wp-block-navigation__description screen-reader-text"
		>
			{ content }
		</div>
	);
}
