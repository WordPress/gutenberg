/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export default function LegacyWidgetInspectorCard( { name, description } ) {
	return (
		<div className="wp-block-legacy-widget-inspector-card">
			<h3 className="wp-block-legacy-widget-inspector-card__name">
				{
					/* translators: %s: the name of the widget being viewed. */
					sprintf( __( 'Widget: %s' ), name )
				}
			</h3>
			<span>{ description }</span>
		</div>
	);
}
