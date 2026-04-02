/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { useViewConfig } from '@wordpress/views';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import usePostFields from '../post-fields';

// TODO: This is hardcoded for now because it's quite special field.
// It's responsible for updating a `page` attribute but on certain
// conditions in the `wp_template` post type.
// We need to think this through how to best connect
// it with `Gutenberg_REST_View_Config_Controller_7_1`.
// The main problem I can think of right now is that when we have
// way to control the forms and fields through APIs, we won't have
// a way to control/remove this field.
const BLOG_TITLE_FORM = {
	layout: { type: 'panel' },
	fields: [ 'blog-title' ],
};

function BlogTitleDataForm( { postType } ) {
	const postFields = usePostFields( { postType } );
	const { postsPageRecord, postsPageId } = useSelect( ( select ) => {
		const { getEntityRecord, getEditedEntityRecord, canUser } =
			select( coreDataStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEntityRecord( 'root', 'site' )
			: undefined;
		const _postsPageId = siteSettings?.page_for_posts;
		const _postsPageRecord = _postsPageId
			? getEditedEntityRecord( 'postType', 'page', _postsPageId )
			: undefined;
		return {
			postsPageRecord: _postsPageRecord,
			postsPageId: _postsPageId,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreDataStore );
	const fields = useMemo( () => {
		return postFields?.filter( ( field ) => field.id === 'blog-title' );
	}, [ postFields ] );
	if ( ! postsPageId || ! postsPageRecord ) {
		return null;
	}
	return (
		<DataForm
			data={ postsPageRecord }
			fields={ fields }
			form={ BLOG_TITLE_FORM }
			onChange={ ( edits ) => {
				editEntityRecord( 'postType', 'page', postsPageId, edits );
			} }
		/>
	);
}

function SiteSettingsDataForm( { postType } ) {
	const postFields = usePostFields( { postType } );
	const { form: siteForm } = useViewConfig( {
		kind: 'root',
		name: 'site',
	} );
	const siteSettings = useSelect( ( select ) => {
		const { getEditedEntityRecord, canUser } = select( coreDataStore );
		return canUser( 'read', { kind: 'root', name: 'site' } )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;
	}, [] );
	const { editEntityRecord } = useDispatch( coreDataStore );
	const siteFieldIds = useMemo( () => {
		return ( siteForm?.fields ?? [] ).map( ( field ) =>
			typeof field === 'string' ? field : field.id
		);
	}, [ siteForm ] );
	const fields = useMemo( () => {
		return postFields?.filter( ( field ) =>
			siteFieldIds.includes( field.id )
		);
	}, [ postFields, siteFieldIds ] );
	if ( ! siteSettings || ! siteForm ) {
		return null;
	}
	return (
		<DataForm
			data={ siteSettings }
			fields={ fields }
			form={ siteForm }
			onChange={ ( edits ) => {
				editEntityRecord( 'root', 'site', undefined, edits );
			} }
		/>
	);
}

export default function TemplateHomeSettings( { postType } ) {
	const slug = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'slug' ),
		[]
	);
	if (
		postType !== 'wp_template' ||
		! [ 'home', 'index' ].includes( slug )
	) {
		return null;
	}
	return (
		<>
			<BlogTitleDataForm postType={ postType } />
			<SiteSettingsDataForm postType={ postType } />
		</>
	);
}
