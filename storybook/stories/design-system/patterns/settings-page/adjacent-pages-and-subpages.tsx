import { SettingsRouter, useSettingsPath } from './router';
import { SettingsExample } from './shared';
import {
	adjacentPageHeader,
	EmailsPage,
	GatewayPage,
	gatewayFromPath,
	GeneralPage,
	PaymentsPage,
	SETTINGS_CRUMB,
	subpageHeader,
	useStoreSettings,
} from './store-pages';

function AdjacentPagesAndSubpagesScreen() {
	const path = useSettingsPath();
	const settings = useStoreSettings();
	const gateway = gatewayFromPath( path );

	if ( gateway ) {
		return (
			<GatewayPage
				key={ path }
				gatewayId={ gateway.id }
				settings={ settings }
				header={ subpageHeader( [
					SETTINGS_CRUMB,
					{ label: 'Payments', to: '/payments' },
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
 * section navigation, and its breadcrumbs pass through the adjacent page it
 * belongs to.
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
