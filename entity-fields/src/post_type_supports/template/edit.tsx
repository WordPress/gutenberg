import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/ui';
import { getItemTitle } from '../../shared/title/get-item-title';
import { unlock } from '../../lock-unlock';
import { useDefaultTemplateLabel, useTemplateFieldMode } from './hooks';
import type { PostWithTemplate } from './types';

type TemplateEditProps = DataFormControlProps< PostWithTemplate >;

type TemplateEditComponentProps = Pick<
	TemplateEditProps,
	'data' | 'field'
> & {
	onChange: ( value: string ) => void;
};

const EMPTY_ARRAY: [] = [];

/**
 * Whether the post is the front page or the posts page, which are assigned
 * a template by the reading settings rather than by this field.
 *
 * @param postType The post type.
 * @param postId   The post id.
 * @return Whether the template can be switched.
 */
function useCanSwitchTemplate(
	postType: string,
	postId: number | string
): boolean {
	return useSelect(
		( select ) => {
			const { getHomePage, getPostsPageId } = unlock(
				select( coreStore )
			);
			const singlePostId = String( postId );
			const isPostsPage = getPostsPageId() === singlePostId;
			const isFrontPage =
				postType === 'page' && getHomePage()?.postId === singlePostId;

			return ! isPostsPage && ! isFrontPage;
		},
		[ postId, postType ]
	);
}

function ClassicTemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditComponentProps ) {
	const value = field.getValue( { item: data } );
	const items = useMemo(
		() =>
			Object.entries( data?.available_templates ?? {} ).map(
				( [ templateSlug, title ] ) => ( {
					label: title,
					value: templateSlug,
				} )
			),
		[ data ]
	);
	const canSwitchTemplate = useCanSwitchTemplate( data.type, data.id );
	return (
		<SelectControl
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={
				items.find( ( item ) => item.value === value ) ??
				items[ 0 ] ??
				null
			}
			items={ items }
			onValueChange={ ( item ) => onChange( item?.value ?? '' ) }
			disabled={ ! canSwitchTemplate }
		/>
	);
}

function BlockThemeTemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditComponentProps ) {
	const postType = data.type;
	const postId = data.id;
	const slug = data.slug;
	const templates = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< WpTemplate >(
				'postType',
				'wp_template',
				{
					per_page: -1,
					post_type: postType,
				}
			) ?? EMPTY_ARRAY,
		[ postType ]
	);
	const canSwitchTemplate = useCanSwitchTemplate( postType, postId );
	const defaultTemplateLabel = useDefaultTemplateLabel(
		postType,
		postId,
		slug
	);
	const value = field.getValue( { item: data } );
	const items = useMemo(
		() => [
			{ label: defaultTemplateLabel, value: '' },
			...templates.map( ( template ) => ( {
				label: getItemTitle( template ),
				value: template.slug,
			} ) ),
		],
		[ templates, defaultTemplateLabel ]
	);
	return (
		<SelectControl
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={
				items.find( ( item ) => item.value === value ) ??
				items[ 0 ] ??
				null
			}
			items={ items }
			onValueChange={ ( item ) => onChange( item?.value ?? '' ) }
			disabled={ ! canSwitchTemplate }
		/>
	);
}

export default function TemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditProps ) {
	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ field.id ]: newValue,
			} ),
		[ field.id, onChange ]
	);
	const mode = useTemplateFieldMode( data );
	if ( ! mode ) {
		return null;
	}
	const Edit =
		mode === 'classic' ? ClassicTemplateEdit : BlockThemeTemplateEdit;
	return <Edit data={ data } field={ field } onChange={ onChangeControl } />;
}
