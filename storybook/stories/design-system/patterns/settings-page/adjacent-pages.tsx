import { SettingsRouter, useSettingsPath } from './router';
import { SettingsExample } from './shared';
import {
	adjacentPageHeader,
	EmailsPage,
	GeneralPage,
	PaymentsPage,
	useStoreSettings,
} from './store-pages';

function AdjacentPagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const header = adjacentPageHeader( path );

	switch ( path ) {
		case '/payments':
			return (
				<PaymentsPage
					key={ path }
					settings={ settings }
					header={ header }
				/>
			);
		case '/emails':
			return (
				<EmailsPage
					key={ path }
					settings={ settings }
					header={ header }
				/>
			);
		default:
			return (
				<GeneralPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( '/general' ) }
				/>
			);
	}
}

/**
 * Peer sections of one settings area, switched with the `Page` navigation.
 * Each page keeps its own draft and Save.
 */
export function AdjacentPagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter initialPath="/general">
				<AdjacentPagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
