/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as coreStore,
	__experimentalUseEntityRecords as useEntityRecords,
} from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import {
	archive,
	blockMeta,
	category,
	footer,
	header,
	home,
	layout,
	list,
	media,
	notFound,
	page,
	post,
	postAuthor,
	postDate,
	search,
	sidebar,
	tag,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Link from '../routes/link';
import Actions from '../list/actions';

const TEMPLATE_ICONS = {
	'front-page': home,
	'single-post': post,
	page,
	archive,
	search,
	404: notFound,
	index: list,
	category,
	author: postAuthor,
	taxonomy: blockMeta,
	date: postDate,
	tag,
	attachment: media,
	footer,
	header,
	sidebar,
};

export default function TemplateList( { templateType } ) {
	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		templateType,
		{
			per_page: -1,
		}
	);
	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	if ( ! templates || isLoading ) {
		return null;
	}

	if ( ! templates.length ) {
		return (
			<div>
				{ sprintf(
					// translators: The template type name, should be either "templates" or "template parts".
					__( 'No %s found.' ),
					postType?.labels?.name?.toLowerCase()
				) }
			</div>
		);
	}

	const getIcon = ( slug ) => {
		if ( TEMPLATE_ICONS[ slug ] ) {
			return TEMPLATE_ICONS[ slug ];
		}

		if ( templateType === 'wp_template' ) {
			return layout;
		}

		return sidebar;
	};

	return (
		<div className="edit-site-navigation-sidebar-template-list">
			{ templates.map( ( template ) => (
				<div
					className="edit-site-navigation-sidebar-template-list__item"
					key={ template.id }
				>
					<div className="edit-site-navigation-sidebar-template-list__name">
						<Icon icon={ getIcon( template.slug ) } />
						<Link
							params={ {
								postId: template.id,
								postType: template.type,
							} }
							title={ template.description }
						>
							{ decodeEntities(
								template.title?.rendered || template.slug
							) }
						</Link>
					</div>
					<Actions template={ template } />
				</div>
			) ) }
		</div>
	);
}
