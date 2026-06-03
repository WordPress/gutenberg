/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetPicker } from '../widget-picker';
import type { WidgetType } from '../../../widget-primitives';

/**
 * Modal-based widget inserter. The dialog stays hidden until `inserterOpen`
 * flips to `true` from any compound sharing the UI context.
 */
export function Inserter() {
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
