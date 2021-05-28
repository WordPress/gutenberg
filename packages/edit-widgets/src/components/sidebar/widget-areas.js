/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { blockDefault } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../../store';

export default function WidgetAreas( { selectedWidgetAreaId } ) {
	const widgetAreas = useSelect(
		( select ) => select( editWidgetsStore ).getWidgetAreas(),
		[]
	);

	const selectedWidgetArea = useMemo(
		() =>
			selectedWidgetAreaId &&
			widgetAreas?.find(
				( widgetArea ) => widgetArea.id === selectedWidgetAreaId
			),
		[ selectedWidgetAreaId, widgetAreas ]
	);

	let description;
	if ( ! selectedWidgetArea ) {
		description = __(
			'Widget Areas are global parts in your site’s layout that can accept blocks. These vary by theme, but are typically parts like your Sidebar or Footer.'
		);
	} else if ( selectedWidgetAreaId === 'wp_inactive_widgets' ) {
		description = __(
			'Blocks in this Widget Area will not be displayed in your site.'
		);
	} else {
		description = selectedWidgetArea.description;
	}

	return (
		<div className="edit-widgets-widget-areas">
			<div className="edit-widgets-widget-areas__top-container">
				<BlockIcon icon={ blockDefault } />
				<div>
					<p>{ description }</p>
					{ widgetAreas?.length === 0 && (
						<p>
							{ __(
								'Your theme does not contain any Widget Areas.'
							) }
						</p>
					) }
					{ ! selectedWidgetArea && (
						<Button
							href={ addQueryArgs( 'customize.php', {
								'autofocus[panel]': 'widgets',
								return: 'themes.php?page=gutenberg-widgets',
							} ) }
							variant="tertiary"
						>
							{ __( 'Manage with live preview' ) }
						</Button>
					) }
				</div>
			</div>
		</div>
	);
}
