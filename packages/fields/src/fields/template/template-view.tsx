/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { getDefaultTemplateLabel } from './utils';

export const TemplateView = ( {
	item,
	field,
}: DataViewRenderFieldProps< BasePost > ) => {
	const postType = item.type;
	const slug = item.slug;
	const postId = item.id;
	const templateSlug = field.getValue( { item } );

	const templateLabel = useSelect(
		( select ) => {
			if ( templateSlug ) {
				const allTemplates = select(
					coreStore
				).getEntityRecords< WpTemplate >( 'postType', 'wp_template', {
					per_page: -1,
					post_type: postType,
				} );
				const match = allTemplates?.find(
					( t ) => t.slug === templateSlug
				);
				return match ? getItemTitle( match ) : templateSlug;
			}

			return getDefaultTemplateLabel( select, postType, postId, slug );
		},
		[ postType, postId, slug, templateSlug ]
	);

	return <>{ templateLabel }</>;
};
