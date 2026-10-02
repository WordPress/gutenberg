import { Page } from '@wordpress/admin-ui';
import { _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useViewConfig } from '@wordpress/views';
import { useFields } from '@wordpress/fields-loader';
import { loadEditorAssets } from '@wordpress/lazy-editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { inertValue } from '@wordpress/react-inert-value';
import { Notice } from '@wordpress/ui';
import styles from './style.module.scss';

type SiteSettings = {
	title?: string;
	description?: string;
	site_logo?: number;
	site_icon?: number;
};

/*
 * The media fields open the WordPress media modal, which needs the media
 * assets (`wp.media` and friends) that the editor canvas loads lazily. This
 * screen mounts a preview canvas, so they normally arrive moments after the
 * screen does — but a fast click would still beat them and crash the route.
 * Gate the field's edit component on the shared editor assets.
 *
 * A stopgap owned by the route, like the identical wrapper in
 * `routes/post-list`: ultimately a field should be able to declare this kind
 * of asset dependency itself; once that exists, remove this wrapper.
 */
function withEditorAssets( FieldEdit: any ) {
	return function EditWithEditorAssets( props: any ) {
		const [ isReady, setIsReady ] = useState(
			() => !! ( window as any ).wp?.media
		);
		useEffect( () => {
			if ( ! isReady ) {
				loadEditorAssets().then( () => setIsReady( true ) );
			}
		}, [ isReady ] );

		// Render the field right away — only opening the modal needs the
		// assets — and keep it inert until they have loaded.
		return (
			<div
				aria-busy={ ! isReady || undefined }
				style={ ! isReady ? { opacity: 0.6 } : undefined }
				// @ts-expect-error inert not typed properly
				inert={ inertValue( ! isReady ) }
			>
				<FieldEdit { ...props } />
			</div>
		);
	};
}

const MEDIA_FIELDS = [ 'site_logo', 'site_icon' ];

/**
 * The stage only renders a form, so it requests the `form` of the entity view
 * configuration alone. Must match the fields the route loader requests so both
 * resolve under the same cache key.
 */
const VIEW_CONFIG_FIELDS = [ 'form' ];

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
	const { form } = useViewConfig( {
		kind: 'root',
		name: 'site',
		fields: VIEW_CONFIG_FIELDS,
	} );
	// The fields come from the server, see the `root_site` collection of
	// `@wordpress/core-fields`. The route loader warms them up.
	const {
		fields: _fields,
		isLoading: isLoadingFields,
		error: fieldsError,
	} = useFields< SiteSettings >( { kind: 'root', name: 'site' } );
	const fields = useMemo(
		() =>
			_fields.map( ( field ) =>
				MEDIA_FIELDS.includes( field.id ) && field.Edit
					? { ...field, Edit: withEditorAssets( field.Edit ) }
					: field
			),
		[ _fields ]
	);

	const onChange = ( edits: Record< string, any > ) => {
		// The site entity is a singleton and has no record key.
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	if ( ! form ) {
		// The route loader resolves the form configuration before the stage
		// mounts, so this only guards against the store being reset.
		return null;
	}

	return (
		<Page title={ _x( 'Identity', 'site identity' ) } headingLevel={ 2 }>
			<div className={ styles.form }>
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

export const stage = Identity;
