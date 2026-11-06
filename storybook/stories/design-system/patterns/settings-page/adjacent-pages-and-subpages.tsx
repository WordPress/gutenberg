import { SettingsRouter, useSettingsPath } from './router';
import { SettingsExample } from './shared';
import {
	adjacentPageHeader,
	EmailsPage,
	GatewayPage,
	gatewayFromPath,
	GeneralPage,
	PaymentsPage,
	subpageHeader,
	useStoreSettings,
} from './store-pages';

function AdjacentPagesAndSubpagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const gateway = gatewayFromPath( path );

	if ( gateway ) {
		// The ancestor is always the area title, while its link returns to
		// the adjacent page the subpage belongs to.
		return (
			<GatewayPage
				key={ path }
				gatewayId={ gateway.id }
				settings={ settings }
				header={ subpageHeader( [
					{ label: 'Settings', to: '/payments' },
					{ label: gateway.name },
				] ) }
			/>
		);
	}

	switch ( path ) {
		case '/payments':
			return (
				<PaymentsPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( path ) }
					showGateways
				/>
			);
		case '/emails':
			return (
				<EmailsPage
					key={ path }
					settings={ settings }
					header={ adjacentPageHeader( path ) }
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
 * Adjacent pages where one page leads to a subpage. The subpage drops the
 * section navigation and shows breadcrumbs rooted at the area title.
 */
export function AdjacentPagesAndSubpagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter initialPath="/payments">
				<AdjacentPagesAndSubpagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
