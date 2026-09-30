import { createRoot, StrictMode } from '@wordpress/element';
import { RegistryProvider } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import PostPickerHost from './components/post-picker-host';

const mounted = new WeakSet< DataRegistry >();

/**
 * Renders the post picker host into its own root on `document.body`, once
 * per registry. The host reads the store of the registry that opened it.
 *
 * @param registry The registry `pickPosts` was dispatched on.
 */
export function mountPostPicker( registry: DataRegistry ) {
	if ( mounted.has( registry ) ) {
		return;
	}
	mounted.add( registry );

	const container = document.createElement( 'div' );
	container.className = 'post-picker-root';
	document.body.appendChild( container );
	createRoot( container ).render(
		<StrictMode>
			<RegistryProvider value={ registry }>
				<PostPickerHost />
			</RegistryProvider>
		</StrictMode>
	);
}
