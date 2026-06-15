/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { useDefaultTemplateLabel, useTemplateFieldMode } from './hooks';

function ClassicTemplateView( {
	item,
	field,
}: DataViewRenderFieldProps< BasePost > ) {
	const templateSlug = field.getValue( { item } );
	const availableTemplates = ( ( item as Record< string, any > )
		?.available_templates ?? {} ) as Record< string, string >;

	const classicLabel =
		templateSlug && availableTemplates[ templateSlug ]
			? availableTemplates[ templateSlug ]
			: __( 'Default template' );

	return <>{ classicLabel }</>;
}

function BlockThemeTemplateView( {
	item,
	field,
}: DataViewRenderFieldProps< BasePost > ) {
	const postType = item.type;
	const slug = item.slug;
	const postId = item.id;
	const templateSlug = field.getValue( { item } );

	const defaultTemplateLabel = useDefaultTemplateLabel(
		postType,
		postId,
		slug
	);

	const templateLabel = useSelect(
		( select ) => {
			if ( ! templateSlug ) {
				return;
			}

			const allTemplates = select(
				coreStore
			).getEntityRecords< WpTemplate >( 'postType', 'wp_template', {
				per_page: -1,
				post_type: postType,
			} );
			const match = allTemplates?.find(
				( t ) => t.slug === templateSlug
			);
			return match ? getItemTitle( match ) : undefined;
		},
		[ postType, templateSlug ]
	);

	return <>{ templateLabel ?? defaultTemplateLabel }</>;
}

export const TemplateView = ( {
	item,
	field,
}: DataViewRenderFieldProps< BasePost > ) => {
	const mode = useTemplateFieldMode( item );
	if ( ! mode || ! [ 'block-theme', 'classic' ].includes( mode ) ) {
		return null;
	}
	const View =
		mode === 'classic' ? ClassicTemplateView : BlockThemeTemplateView;
	return <View item={ item } field={ field } />;
};
