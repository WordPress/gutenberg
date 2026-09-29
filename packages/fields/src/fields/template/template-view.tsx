import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { usePostTemplate, useTemplateFieldMode } from './hooks';

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

	const { currentTemplate } = usePostTemplate(
		postType,
		postId,
		slug,
		templateSlug
	);
	return (
		<>{ currentTemplate ? getItemTitle( currentTemplate ) : undefined }</>
	);
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
