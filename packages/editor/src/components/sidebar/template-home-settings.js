/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import usePostFields from '../post-fields';

const HOME_TEMPLATE_FIELD_IDS = [ 'posts_per_page', 'default_comment_status' ];

// Inlined here because it's only meaningful in the home/index template context:
// it proxies writes to the posts page title, not to the template entity.
const blogTitleField = {
	id: 'blog-title',
	type: 'text',
	label: __( 'Blog title' ),
	getValue: ( { item } ) => item.title?.raw ?? item.title ?? '',
	setValue: ( { value } ) => ( { title: value } ),
	description: __(
		'Set the Posts Page title. Appears in search results, and when the page is shared on social media.'
	),
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
};

// These are editor-specific affordances for the home/index template context:
// posts_per_page and default_comment_status edit root/site, blog-title edits
// the posts page. Hardcoded until the view config API supports cross-entity
// field routing, if we decide to implement that.
const HOME_TEMPLATE_FORM = {
	layout: { type: 'panel' },
	fields: [ blogTitleField.id, ...HOME_TEMPLATE_FIELD_IDS ],
};

export default function TemplateHomeSettings( { postType } ) {
	const slug = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'slug' ),
		[]
	);
	const { siteSettings, postsPageRecord, postsPageId } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, canUser } = select( coreDataStore );
			const _siteSettings = canUser( 'read', {
				kind: 'root',
				name: 'site',
			} )
				? getEditedEntityRecord( 'root', 'site' )
				: undefined;
			const _postsPageId = _siteSettings?.page_for_posts;
			const _postsPageRecord = _postsPageId
				? getEditedEntityRecord( 'postType', 'page', _postsPageId )
				: undefined;
			return {
				siteSettings: _siteSettings,
				postsPageRecord: _postsPageRecord,
				postsPageId: _postsPageId,
			};
		},
		[]
	);
	const { editEntityRecord } = useDispatch( coreDataStore );
	const postFields = usePostFields( { postType } );

	const fields = useMemo( () => {
		const siteFields =
			postFields?.filter( ( field ) =>
				HOME_TEMPLATE_FIELD_IDS.includes( field.id )
			) ?? [];
		return postsPageId ? [ blogTitleField, ...siteFields ] : siteFields;
	}, [ postFields, postsPageId ] );

	const data = useMemo(
		() => ( { ...siteSettings, ...postsPageRecord } ),
		[ siteSettings, postsPageRecord ]
	);

	if (
		postType !== 'wp_template' ||
		! [ 'home', 'index' ].includes( slug ) ||
		! siteSettings
	) {
		return null;
	}

	return (
		<DataForm
			data={ data }
			fields={ fields }
			form={ HOME_TEMPLATE_FORM }
			onChange={ ( edits ) => {
				const { title, ...siteEdits } = edits;
				if ( Object.keys( siteEdits ).length ) {
					editEntityRecord( 'root', 'site', undefined, siteEdits );
				}
				if ( title !== undefined && postsPageId ) {
					editEntityRecord( 'postType', 'page', postsPageId, {
						title,
					} );
				}
			} }
		/>
	);
}
