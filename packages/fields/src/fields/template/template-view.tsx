/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

export const TemplateView = ( {
	item,
}: DataViewRenderFieldProps< BasePost > ) => {
	const template = item.template;
	const postType = item.type;
	const slug = item.slug;

	const templateTitle = useSelect(
		( select ) => {
			const { getEntityRecords, getDefaultTemplateId, getEntityRecord } =
				select( coreStore );

			// If a specific template slug is set, find it directly.
			if ( template ) {
				const templates = getEntityRecords< WpTemplate >(
					'postType',
					'wp_template',
					{ per_page: -1, post_type: postType }
				);
				const found = templates?.find( ( t ) => t.slug === template );
				if ( found ) {
					return decodeEntities( found.title.rendered );
				}
			}

			// Resolve the default template for this post type.
			let slugToCheck;
			if ( slug ) {
				slugToCheck =
					postType === 'page'
						? `${ postType }-${ slug }`
						: `single-${ postType }-${ slug }`;
			} else {
				slugToCheck =
					postType === 'page' ? 'page' : `single-${ postType }`;
			}

			if ( postType ) {
				const templateId = getDefaultTemplateId( {
					slug: slugToCheck,
				} );
				if ( templateId ) {
					const defaultTemplate = getEntityRecord< WpTemplate >(
						'postType',
						'wp_template',
						templateId
					);
					if ( defaultTemplate ) {
						return decodeEntities( defaultTemplate.title.rendered );
					}
				}
			}

			return '';
		},
		[ template, postType, slug ]
	);

	return <>{ templateTitle }</>;
};
