/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';

const fields = [
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

const form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: [ 'site_logo', 'site_icon' ],
};

export default function SidebarIdentity() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' ),
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onChange = ( edits ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page title={ __( 'Identity' ) } hasPadding>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</Page>
	);
}
