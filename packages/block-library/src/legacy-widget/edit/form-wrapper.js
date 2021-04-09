export default function FormWrapper( { title, isVisible, children } ) {
	return (
		<div
			className="wp-block-legacy-widget__edit-form"
			hidden={ ! isVisible }
		>
			<h3 className="wp-block-legacy-widget__edit-form-title">
				{ title }
			</h3>
			{ children }
		</div>
	);
}
