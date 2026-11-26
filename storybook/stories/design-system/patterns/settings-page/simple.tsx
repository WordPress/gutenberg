import { useState } from '@wordpress/element';
import { SettingsRouter } from './router';
import {
	checkoutFields,
	generalFields,
	generalSettings,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function SimpleSettingsPage() {
	const [ saved, setSaved ] = useState( generalSettings );

	return (
		<SettingsFormPage
			title="Settings"
			subTitle="Manage how your store looks and works."
			saved={ saved }
			onSave={ setSaved }
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
					<SettingsSection title="Checkout">
						<SettingsForm
							data={ data }
							fields={ checkoutFields }
							onChange={ onChange }
						/>
					</SettingsSection>
				</>
			) }
		</SettingsFormPage>
	);
}

export function SimpleSettingsExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SimpleSettingsPage />
			</SettingsRouter>
		</SettingsExample>
	);
}
