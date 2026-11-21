import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { SettingsRouter } from './router';
import {
	bankStatementFields,
	paymentOptionFields,
	paymentsAndPayoutsSettings,
	payoutNotificationFields,
	payoutScheduleFields,
	SettingsExample,
	SettingsForm,
	SettingsFormPage,
	SettingsGroup,
	SettingsSection,
} from './shared';

function SectionsPage() {
	const [ saved, setSaved ] = useState( paymentsAndPayoutsSettings );

	return (
		<SettingsFormPage
			title="Payments"
			subTitle="Manage how you take payments and receive payouts."
			saved={ saved }
			onSave={ setSaved }
		>
			{ ( { data, onChange } ) => (
				<Stack direction="column" gap="3xl">
					<SettingsGroup
						title="Accepting payments"
						description="How customers pay at checkout."
					>
						<SettingsSection
							title="Payment options"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ paymentOptionFields }
								onChange={ onChange }
							/>
						</SettingsSection>
						<SettingsSection
							title="Bank statements"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ bankStatementFields }
								onChange={ onChange }
							/>
						</SettingsSection>
					</SettingsGroup>
					<SettingsGroup
						title="Payouts"
						description="When you receive the money from your sales."
					>
						<SettingsSection title="Schedule" headingLevel={ 3 }>
							<SettingsForm
								data={ data }
								fields={ payoutScheduleFields }
								onChange={ onChange }
							/>
						</SettingsSection>
						<SettingsSection
							title="Notifications"
							headingLevel={ 3 }
						>
							<SettingsForm
								data={ data }
								fields={ payoutNotificationFields }
								onChange={ onChange }
							/>
						</SettingsSection>
					</SettingsGroup>
				</Stack>
			) }
		</SettingsFormPage>
	);
}

export function SectionsExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<SectionsPage />
			</SettingsRouter>
		</SettingsExample>
	);
}
