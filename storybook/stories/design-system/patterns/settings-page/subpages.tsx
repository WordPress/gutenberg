import { SettingsRouter, useSettingsPath } from './router';
import {
	generalFields,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';
import {
	GatewayPage,
	gatewayFromPath,
	GatewaysSection,
	subpageHeader,
	useStoreSettings,
} from './store-pages';

function SubpagesScreen() {
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
					{ label: 'Settings', to: '/' },
					{ label: gateway.name },
				] ) }
			/>
		);
	}

	return (
		<SettingsFormPage
			key={ path }
			title="Settings"
			subTitle="Manage how your store looks and works."
			saved={ settings.general }
			onSave={ settings.setGeneral }
		>
			{ ( { data, onChange } ) => (
				<>
					<SettingsSection
						title="Store details"
						description="How your store is presented to customers."
					>
						<SettingsForm
							data={ data }
							fields={ generalFields }
							onChange={ onChange }
						/>
					</SettingsSection>
					<GatewaysSection settings={ settings } />
				</>
			) }
		</SettingsFormPage>
	);
}

/**
 * A settings page with a subpage for detail that would crowd the main
 * page. The subpage replaces the title with breadcrumbs that lead back.
 */
export function SubpagesExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SubpagesScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
