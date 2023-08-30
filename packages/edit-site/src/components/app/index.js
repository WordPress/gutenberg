/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	Popover,
	__experimentalTheme as Theme,
} from '@wordpress/components';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSetting } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import { unlock } from '../../lock-unlock';

const { RouterProvider } = unlock( routerPrivateApis );

export default function App() {
	const colors = useSetting( 'color.palette.theme' );
	console.log( 'colors:', colors );
	const { createErrorNotice } = useDispatch( noticesStore );

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	return (
		<Theme
			accent={
				colors?.find( ( c ) => c.slug === 'primary' ).color || '#3858E9'
			}
			fun={ 0.4 }
			style={ { height: '100%' } }
		>
			<ShortcutProvider style={ { height: '100%' } }>
				<SlotFillProvider>
					<GlobalStylesProvider>
						<Popover.Slot />
						<UnsavedChangesWarning />
						<RouterProvider>
							<Layout />
							<PluginArea onError={ onPluginAreaError } />
						</RouterProvider>
					</GlobalStylesProvider>
				</SlotFillProvider>
			</ShortcutProvider>
		</Theme>
	);
}
