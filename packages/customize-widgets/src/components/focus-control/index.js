/**
 * WordPress dependencies
 */
import { createContext, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { settingIdToWidgetId } from '../../utils';

export const FocusControlContext = createContext( null );

export default function FocusControl( { api, sidebarControls, children } ) {
	const [ focusedWidgetId, setFocusedWidgetId ] = useState( null );

	useEffect( () => {
		function handleFocus( settingId ) {
			const widgetId = settingIdToWidgetId( settingId );

			for ( const sidebarControl of sidebarControls ) {
				const widgets = sidebarControl.setting.get();

				if ( widgets.includes( widgetId ) ) {
					sidebarControl.sectionInstance.expand();

					setFocusedWidgetId( widgetId );
					break;
				}
			}
		}

		function handleReady() {
			api.previewer.preview.bind(
				'focus-control-for-setting',
				handleFocus
			);
		}

		api.previewer.bind( 'ready', handleReady );

		return () => {
			api.previewer.unbind( 'ready', handleReady );
			api.previewer.preview.unbind(
				'focus-control-for-setting',
				handleFocus
			);
		};
	}, [ api, sidebarControls ] );

	return (
		<FocusControlContext.Provider value={ focusedWidgetId }>
			{ children }
		</FocusControlContext.Provider>
	);
}
