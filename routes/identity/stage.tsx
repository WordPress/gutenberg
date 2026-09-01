import { Page } from '@wordpress/admin-ui';
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { DataForm, type Field, type Form } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';
import { loadEditorAssets } from '@wordpress/lazy-editor';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
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
function MediaEditWithEditorAssets( props: any ) {
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
			inert={ ! isReady ? 'true' : undefined }
		>
			<MediaEdit { ...props } />
		</div>
	);
}

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
		Edit: MediaEditWithEditorAssets,
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
		Edit: MediaEditWithEditorAssets,
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
		<Page title={ _x( 'Identity', 'site identity' ) } headingLevel={ 2 }>
			<div className={ styles.form }>
				<DataForm
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ onChange }
				/>
			</div>
		</Page>
	);
}

export const stage = Identity;
