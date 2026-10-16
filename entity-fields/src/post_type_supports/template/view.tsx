import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../shared/title/get-item-title';
import { useDefaultTemplateLabel, useTemplateFieldMode } from './hooks';
import type { PostWithTemplate } from './types';

/*
 * The template assigned to a post, or the default one.
 */

type TemplateViewProps = Pick<
	DataViewRenderFieldProps< PostWithTemplate >,
	'item' | 'field'
>;

function ClassicTemplateView( { item, field }: TemplateViewProps ) {
	const templateSlug = field.getValue( { item } );
	const availableTemplates = item?.available_templates ?? {};

	return (
		<>
			{ templateSlug && availableTemplates[ templateSlug ]
				? availableTemplates[ templateSlug ]
				: __( 'Default template' ) }
		</>
	);
}

function BlockThemeTemplateView( { item, field }: TemplateViewProps ) {
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

export default function TemplateView( { item, field }: TemplateViewProps ) {
	const mode = useTemplateFieldMode( item );
	if ( ! mode ) {
		return null;
	}
	const View =
		mode === 'classic' ? ClassicTemplateView : BlockThemeTemplateView;
	return <View item={ item } field={ field } />;
}
