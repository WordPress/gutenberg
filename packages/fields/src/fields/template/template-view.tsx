import { useSelect } from '@wordpress/data';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { useTemplateFieldMode } from './hooks';

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
	const postId = item.id;
	const templateSlug = field.getValue( { item } );

	const templateLabel = useSelect(
		( select ) => {
			const allTemplates = select(
				coreStore
			).getEntityRecords< WpTemplate >( 'postType', 'wp_template', {
				per_page: -1,
				post_id: Number( postId ),
			} );
			if ( allTemplates?.length === 1 ) {
				return getItemTitle( allTemplates[ 0 ] );
			}
			const match = allTemplates?.find(
				( t ) => t.slug === templateSlug
			);
			const effectiveTemplate = match ?? allTemplates?.[ 0 ];
			return effectiveTemplate
				? getItemTitle( effectiveTemplate )
				: undefined;
		},
		[ postId, templateSlug ]
	);

	return <>{ templateLabel }</>;
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
