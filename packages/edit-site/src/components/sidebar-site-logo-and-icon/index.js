/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';

const fields = [
	{
		id: 'site_logo',
		type: 'media',
		label: __( 'Site Logo' ),
		description: __( 'Upload a logo to display in the Site Logo block.' ),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_logo: value ?? 0,
		} ),
		enableSorting: false,
		filterBy: false,
	},
	{
		id: 'site_icon',
		type: 'media',
		label: __( 'Site Icon' ),
		description: __(
			'Site Icons are what you see in browser tabs, bookmark bars, and within the WordPress mobile apps. It should be square and at least 512 by 512 pixels.'
		),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_icon: value ?? 0,
		} ),
		enableSorting: false,
		filterBy: false,
	},
];

const form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: [ 'site_logo', 'site_icon' ],
};

export default function SidebarSiteLogoAndIcon() {
	const { record } = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		return {
			record: getEditedEntityRecord( 'root', 'site' ),
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );

	const data = useMemo( () => {
		return {
			site_logo: record?.site_logo ?? 0,
			site_icon: record?.site_icon ?? 0,
		};
	}, [ record?.site_logo, record?.site_icon ] );

	const onChange = ( edits ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page title={ __( 'Site Logo & Icon' ) } hasPadding>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</Page>
	);
}
