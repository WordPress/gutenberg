/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { postsPerPageField, siteDiscussionField } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

// The hardcoded `posts_per_page`, `default_comment_status`, and `blog-title`
// fields are a niche editor affordance specific to the post summary panel for
// `home/index` templates. They target different entities — `posts_per_page` and
// `default_comment_status` write to `root/site`, `blog-title` writes to the
// posts page — and the data model around forms and templates intentionally
// excludes this case to keep a cleaner model. Multi-entity support in the
// view config API may be considered in the future. As a consequence, these
// fields cannot be controlled via the fields API or the PHP view config —
// unlike fields registered for `wp_template` in general.
const SITE_FIELDS = [ postsPerPageField, siteDiscussionField ];

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

const HOME_TEMPLATE_FORM = {
	layout: { type: 'panel' },
	fields: [ blogTitleField, ...SITE_FIELDS ].map( ( f ) => f.id ),
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

	const fields = useMemo( () => {
		return postsPageId ? [ blogTitleField, ...SITE_FIELDS ] : SITE_FIELDS;
	}, [ postsPageId ] );

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
