import { Page } from '@wordpress/admin-ui';
import { _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useFields } from '@wordpress/fields-loader';
import { Notice } from '@wordpress/ui';
import { useViewConfig } from '@wordpress/views';

// The screen only renders a form, so it requests the `form` of the entity
// view configuration alone.
const VIEW_CONFIG_FIELDS = [ 'form' ];

export default function SidebarIdentity() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' ),
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );
	const { form } = useViewConfig( {
		kind: 'root',
		name: 'site',
		fields: VIEW_CONFIG_FIELDS,
	} );
	// The fields come from the server, see the `root_site` collection of
	// `@wordpress/core-fields`.
	const {
		fields,
		isLoading: isLoadingFields,
		error: fieldsError,
	} = useFields( { kind: 'root', name: 'site' } );

	const onChange = ( edits ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	if ( ! form ) {
		return null;
	}

	return (
		<Page title={ _x( 'Identity', 'site identity' ) } headingLevel={ 2 }>
			<div className="edit-site-sidebar-identity__form">
				{ fieldsError && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ fieldsError.message }
						</Notice.Description>
					</Notice.Root>
				) }
				{ ! isLoadingFields && ! fieldsError && (
					<DataForm
						data={ data }
						fields={ fields }
						form={ form }
						onChange={ onChange }
					/>
				) }
			</div>
		</Page>
	);
}
