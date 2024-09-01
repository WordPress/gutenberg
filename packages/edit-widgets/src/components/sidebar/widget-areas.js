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
import { safeHTML } from '@wordpress/dom';

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
					<p
						// Use `dangerouslySetInnerHTML` to keep backwards
						// compatibility. Basic markup in the description is an
						// established feature of WordPress.
						// @see https://github.com/WordPress/gutenberg/issues/33106
						dangerouslySetInnerHTML={ {
							__html: safeHTML( description ),
						} }
					/>
					{ widgetAreas?.length === 0 && (
						<p>
							{ __(
								'Your theme does not contain any Widget Areas.'
							) }
						</p>
					) }
					{ ! selectedWidgetArea && (
						<Button
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
							href={ addQueryArgs( 'customize.php', {
								'autofocus[panel]': 'widgets',
								return: window.location.pathname,
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
