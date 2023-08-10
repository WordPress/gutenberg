export default function AccessibleDescription( { id, children } ) {
	return (
		<div
			id={ id }
			className="wp-block-navigation__description screen-reader-text"
		>
			{ children }
		</div>
	);
}
