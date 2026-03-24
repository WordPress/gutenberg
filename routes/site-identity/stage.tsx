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
		setValue: ( { value }: { value: number | null } ) => ( {
			site_logo: value ?? 0,
		} ),
	},
	{
		id: 'title',
		type: 'text',
		label: __( 'Site Title' ),
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Tagline' ),
	},
];

const form = {
	layout: {
		type: 'regular' as const,
		labelPosition: 'top' as const,
	},
	fields: [ 'site_logo', 'title', 'description' ],
};

function Stage() {
	const data = useSelect(
		( select ) =>
			( select( coreStore ) as any ).getEditedEntityRecord(
				'root',
				'site'
			),
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onChange = ( edits: Record< string, any > ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page title={ __( 'Site Identity' ) } hasPadding>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</Page>
	);
}

export const stage = Stage;
