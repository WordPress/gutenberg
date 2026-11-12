import { useRef, useState } from '@wordpress/element';
import type { GeneralSettings } from './shared';
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

function FailedSavePage() {
	const [ saved, setSaved ] = useState( generalSettings );
	// The first save fails, so the example can show the retry.
	const hasFailedRef = useRef( false );

	const save = async ( data: GeneralSettings ) => {
		if ( ! hasFailedRef.current ) {
			hasFailedRef.current = true;
			throw new Error( 'The request failed.' );
		}
		setSaved( data );
	};

	return (
		<SettingsFormPage title="Settings" saved={ saved } onSave={ save }>
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

/**
 * A page whose first save fails. The draft is kept, a notice at the top of
 * the form explains what happened, and "Try again" submits the form again.
 */
export function FailedSaveExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<FailedSavePage />
			</SettingsRouter>
		</SettingsExample>
	);
}
