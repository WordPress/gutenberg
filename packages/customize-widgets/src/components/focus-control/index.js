/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useEffect,
	useContext,
	useCallback,
	useMemo,
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

	const focusWidget = useCallback(
		( widgetId ) => {
			for ( const sidebarControl of sidebarControls ) {
				const widgets = sidebarControl.setting.get();

				if ( widgets.includes( widgetId ) ) {
					sidebarControl.sectionInstance.expand( {
						// Schedule it after the complete callback so that
						// it won't be overridden by the "Back" button focus.
						completeCallback() {
							// Create a "ref-like" object every time to ensure
							// the same widget id can also triggers the focus control.
							setFocusedWidgetIdRef( { current: widgetId } );
						},
					} );

					break;
				}
			}
		},
		[ sidebarControls ]
	);

	useEffect( () => {
		function handleFocus( settingId ) {
			const widgetId = settingIdToWidgetId( settingId );

			focusWidget( widgetId );
		}

		let previewBound = false;

		function handleReady() {
			api.previewer.preview.bind(
				'focus-control-for-setting',
				handleFocus
			);
			previewBound = true;
		}

		api.previewer.bind( 'ready', handleReady );

		return () => {
			api.previewer.unbind( 'ready', handleReady );
			if ( previewBound ) {
				api.previewer.preview.unbind(
					'focus-control-for-setting',
					handleFocus
				);
			}
		};
	}, [ api, focusWidget ] );

	const context = useMemo(
		() => [ focusedWidgetIdRef, focusWidget ],
		[ focusedWidgetIdRef, focusWidget ]
	);

	return (
		<FocusControlContext.Provider value={ context }>
			{ children }
		</FocusControlContext.Provider>
	);
}

export const useFocusControl = () => useContext( FocusControlContext );
