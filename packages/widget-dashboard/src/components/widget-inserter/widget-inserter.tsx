import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Dialog,
} from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetPicker } from '../widget-picker';

/**
 * Modal widget inserter, mounted by the engine and shown while `inserterOpen`
 * is set in the shared UI context. Selecting widgets appends them to the
 * layout and closes the dialog.
 *
 * New instances start at the host's insertion default — the first listed
 * `widthOptions` choice — so they carry an allowed width; with width
 * choices active, the staging boundary rejects an insertion whose width
 * is not one of them.
 */
export function WidgetInserter() {
	const { layout, onLayoutChange, widthOptions } =
		useDashboardInternalContext();
	const { inserterOpen, setInserterOpen } = useDashboardUIContext();

	const insertionDefaultWidth =
		widthOptions.kind === 'custom'
			? widthOptions.options[ 0 ].value
			: undefined;

	const insertWidgets = useCallback(
		( widgetTypes: WidgetType[] ) => {
			if ( widgetTypes.length > 0 ) {
				const newWidgets = widgetTypes.map( ( widgetType ) =>
					createDashboardWidget(
						widgetType,
						undefined,
						insertionDefaultWidth
					)
				);
				onLayoutChange( [ ...layout, ...newWidgets ] );
			}

			setInserterOpen( false );
		},
		[ layout, onLayoutChange, setInserterOpen, insertionDefaultWidth ]
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
						// Legacy popovers opened inside, like the DataViews view config, render below the compat overlay slot.
						container={ document.body }
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
					<Dialog.CloseIconButton />
				</Dialog.Header>

				<Dialog.Content>
					<WidgetPicker onSelect={ insertWidgets } />
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
