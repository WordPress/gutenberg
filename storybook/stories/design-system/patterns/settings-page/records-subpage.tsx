import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { pencil } from '@wordpress/icons';
import { Link as RouterLink, useNavigate } from '@wordpress/route';
import type { ApiKey } from './api-keys';
import { KeyForm, KeysTable, useKeys } from './api-keys';
import { SettingsRouter, useSettingsPath } from './router';
import {
	SettingsContent,
	SettingsExample,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function KeysPage( { keys }: { keys: ApiKey[] } ) {
	const navigate = useNavigate();
	const actions: Action< ApiKey >[] = [
		{
			id: 'edit',
			label: 'Edit',
			icon: pencil,
			isPrimary: true,
			callback: ( [ key ] ) => navigate( { to: `/keys/${ key.id }` } ),
		},
	];

	return (
		<Page
			title="API keys"
			subTitle="Let apps and services connect to your site."
			showSidebarToggle={ false }
			hasPadding
		>
			<SettingsContent wide>
				<KeysTable
					keys={ keys }
					actions={ actions }
					renderItemLink={ ( { item, ...props } ) => (
						<RouterLink to={ `/keys/${ item.id }` } { ...props } />
					) }
				/>
			</SettingsContent>
		</Page>
	);
}

function RecordsSubpageScreen() {
	const path = useSettingsPath();
	const { keys, saveKey } = useKeys();
	const key = keys.find( ( { id } ) => path === `/keys/${ id }` );

	if ( ! key ) {
		return <KeysPage keys={ keys } />;
	}

	return (
		<SettingsFormPage
			key={ path }
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: 'API keys', to: '/' },
						{ label: key.name },
					] }
				/>
			}
			saved={ key }
			onSave={ saveKey }
		>
			{ ( { data, onChange } ) => (
				<SettingsSection title="Key details">
					<KeyForm data={ data } onChange={ onChange } />
				</SettingsSection>
			) }
		</SettingsFormPage>
	);
}

/**
 * A table of records where each record opens its own subpage. The subpage
 * has room for a full editor and its Save sits in the `Page` header.
 */
export function RecordsSubpageExample() {
	return (
		<SettingsExample>
			<SettingsRouter>
				<RecordsSubpageScreen />
			</SettingsRouter>
		</SettingsExample>
	);
}
