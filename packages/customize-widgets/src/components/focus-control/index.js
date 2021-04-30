/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useContext,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { settingIdToWidgetId } from '../../utils';

const FocusControlContext = createContext();

export default function FocusControl( { api, sidebarControls, children } ) {
	const [ focusedWidgetIdRef, setFocusedWidgetIdRef ] = useState( {
		current: null,
	} );

	useEffect( () => {
		function handleFocus( settingId ) {
			const widgetId = settingIdToWidgetId( settingId );

			for ( const sidebarControl of sidebarControls ) {
				const widgets = sidebarControl.setting.get();

				if ( widgets.includes( widgetId ) ) {
					sidebarControl.sectionInstance.expand();

					// Create a "ref-like" object every time to ensure
					// the same widget id can also triggers the focus control.
					setFocusedWidgetIdRef( { current: widgetId } );
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
		<FocusControlContext.Provider value={ focusedWidgetIdRef }>
			{ children }
		</FocusControlContext.Provider>
	);
}

export const useFocusedWidgetIdRef = () => useContext( FocusControlContext );
