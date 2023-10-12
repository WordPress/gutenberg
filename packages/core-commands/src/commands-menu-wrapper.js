/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { privateApis } from './private-apis';

/**
 * WordPress dependencies
 */
import { CommandMenu } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';

const { useCommands } = unlock( privateApis );
const { RouterProvider } = unlock( routerPrivateApis );

export function CommandsMenuWrapper() {
	useCommands();

	return (
		<RouterProvider>
			<CommandMenu />
		</RouterProvider>
	);
}
