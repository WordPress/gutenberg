export default function InspectorCard( { name, description } ) {
	return (
		<div className="wp-block-legacy-widget-inspector-card">
			<h3 className="wp-block-legacy-widget-inspector-card__name">
				{ name }
			</h3>
			<span>{ description }</span>
		</div>
	);
}
