/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';
import { __ } from '@wordpress/i18n';

type SiteIdentitySettings = {
	title?: string;
	description?: string;
	site_logo?: number;
	site_icon?: number;
};

const fields: Field< SiteIdentitySettings >[] = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Site Title' ),
		description: __(
			"Displays in your site's layout via the Site Title block."
		),
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Site Tagline' ),
		description: __(
			"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block."
		),
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

function Stage() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' ) as
				| SiteIdentitySettings
				| undefined,
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! data ) {
		return <Spinner />;
	}

	return (
		<Page title={ __( 'Site Identity' ) } headingLevel={ 2 } hasPadding>
			<DataForm< SiteIdentitySettings >
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ ( edits ) => {
					editEntityRecord( 'root', 'site', undefined, edits );
				} }
			/>
		</Page>
	);
}

export const stage = Stage;
