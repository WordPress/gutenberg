import { Page } from '@wordpress/admin-ui';
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm, type Field, type Form } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';
import { decodeEntities } from '@wordpress/html-entities';

type SiteSettings = {
	title?: string;
	description?: string;
	site_logo?: number;
	site_icon?: number;
};

const fields: Field< SiteSettings >[] = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Site Title' ),
		description: __(
			"Displays in your site's layout via the Site Title block."
		),
		getValue: ( { item } ) => decodeEntities( item.title ?? '' ),
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Site Tagline' ),
		description: __(
			"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block."
		),
		getValue: ( { item } ) => decodeEntities( item.description ?? '' ),
	},
	{
		id: 'site_logo',
		type: 'media',
		label: __( 'Site Logo' ),
		description: __(
			"Displays in your site's layout via the Site Logo block."
		),
		placeholder: __( 'Choose logo' ),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_logo: value ?? 0,
		} ),
	},
	{
		id: 'site_icon',
		type: 'media',
		label: __( 'Site Icon' ),
		description: __(
			'Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.'
		),
		placeholder: __( 'Choose icon' ),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_icon: value ?? 0,
		} ),
	},
];

const form: Form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: [ 'title', 'description', 'site_logo', 'site_icon' ],
};

function Identity() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'root',
				'site',
				// The site entity is a singleton and has no record key.
				undefined
			) as SiteSettings,
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onChange = ( edits: Record< string, any > ) => {
		// The site entity is a singleton and has no record key.
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page
			title={ _x( 'Identity', 'site identity' ) }
			headingLevel={ 2 }
			hasPadding
		>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</Page>
	);
}

export const stage = Identity;
