import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import type { Action, View } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';
import { pencil } from '@wordpress/icons';
import { Link as RouterLink, useNavigate } from '@wordpress/route';
import type { ApiKey } from './api-keys';
import { defaultKeysView, KeyForm, KeysTable, useKeys } from './api-keys';
import { SettingsRouter, useSettingsPath } from './router';
import {
	SettingsContent,
	SettingsExample,
	SettingsFormPage,
	SettingsSection,
} from './shared';

function KeysPage( {
	keys,
	view,
	onChangeView,
}: {
	keys: ApiKey[];
	view: View;
	onChangeView: ( view: View ) => void;
} ) {
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
					view={ view }
					onChangeView={ onChangeView }
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
	// Held above the routes, so returning from a record restores the
	// table's search, filters and page.
	const [ view, setView ] = useState< View >( defaultKeysView );
	const key = keys.find( ( { id } ) => path === `/keys/${ id }` );

	if ( ! key ) {
		return (
			<KeysPage keys={ keys } view={ view } onChangeView={ setView } />
		);
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
			ariaLabel={ key.name }
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
