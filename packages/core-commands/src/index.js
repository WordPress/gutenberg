/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { privateApis } from './private-apis';
export { privateApis };

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { CommandMenu } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';

const { useCommands } = unlock( privateApis );
const { RouterProvider } = unlock( routerPrivateApis );

const mountPoint = document.createElement( 'div' );
mountPoint.id = 'wp-commands';

document.body.appendChild( mountPoint );

const root = createRoot( mountPoint );

function CommandMenuWrapper() {
	useCommands();

	return (
		<RouterProvider>
			<CommandMenu />
		</RouterProvider>
	);
}

root.render( <CommandMenuWrapper /> );
