/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetPicker } from '../widget-picker';

/**
 * Modal widget inserter, mounted by the engine and shown while `inserterOpen`
 * is set in the shared UI context. Selecting widgets appends them to the
 * layout and closes the dialog.
 */
export function WidgetInserter() {
	const { layout, onLayoutChange } = useDashboardInternalContext();
	const { inserterOpen, setInserterOpen } = useDashboardUIContext();

	const insertWidgets = useCallback(
		( widgetTypes: WidgetType[] ) => {
			if ( widgetTypes.length > 0 ) {
				const newWidgets = widgetTypes.map( ( widgetType ) =>
					createDashboardWidget( widgetType )
				);
				onLayoutChange( [ ...layout, ...newWidgets ] );
			}

			setInserterOpen( false );
		},
		[ layout, onLayoutChange, setInserterOpen ]
	);

	if ( ! inserterOpen ) {
		return null;
	}

	return (
		<Dialog.Root open={ inserterOpen } onOpenChange={ setInserterOpen }>
			<Dialog.Popup
				size="full"
				portal={
					<Dialog.Portal
						style={
							{
								'--wp-ui-dialog-z-index': 99999,
							} as React.CSSProperties
						}
					/>
				}
			>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add widget' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>

				<Dialog.Content>
					<WidgetPicker onSelect={ insertWidgets } />
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
