import { useCallback, useMemo } from '@wordpress/element';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { SelectControl as WCSelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { useTemplateFieldMode } from './hooks';
import { unlock } from '../../lock-unlock';

type TemplateEditComponentProps = Omit<
	DataFormControlProps< BasePost >,
	'onChange'
> & {
	onChange: ( value: string ) => void;
};

const EMPTY_ARRAY: [] = [];

function ClassicTemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditComponentProps ) {
	const postId =
		typeof data.id === 'number' ? data.id : parseInt( data.id, 10 );
	const value = field.getValue( { item: data } );
	const options = useMemo(
		() =>
			Object.entries(
				( ( data as Record< string, any > )?.available_templates ??
					{} ) as Record< string, string >
			).map( ( [ templateSlug, title ] ) => ( {
				label: title,
				value: templateSlug,
			} ) ),
		[ data ]
	);
	const canSwitchTemplate = useSelect(
		( select ) => {
			const { getHomePage, getPostsPageId } = unlock(
				select( coreStore )
			);
			const singlePostId = String( postId );
			const isPostsPage = getPostsPageId() === singlePostId;
			const isFrontPage =
				data.type === 'page' && getHomePage()?.postId === singlePostId;

			return ! isPostsPage && ! isFrontPage;
		},
		[ postId, data.type ]
	);
	return (
		<WCSelectControl
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={ value }
			options={ options }
			onChange={ onChange }
			disabled={ ! canSwitchTemplate }
		/>
	);
}

function BlockThemeTemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditComponentProps ) {
	const postId =
		typeof data.id === 'number' ? data.id : parseInt( data.id, 10 );
	const templates = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< WpTemplate >(
				'postType',
				'wp_template',
				{
					per_page: -1,
					post_id: postId,
				}
			) ?? EMPTY_ARRAY,
		[ postId ]
	);
	const assignedSlug = field.getValue( { item: data } );
	const assignedTemplate = templates.find(
		( template ) => template.slug === assignedSlug
	);
	const value =
		assignedTemplate && assignedTemplate !== templates[ 0 ]
			? assignedTemplate.slug
			: '';
	const options = useMemo(
		() =>
			templates.map( ( template, index ) => ( {
				label: getItemTitle( template ),
				value: index === 0 ? '' : template.slug,
			} ) ),
		[ templates ]
	);
	return (
		<WCSelectControl
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={ value }
			options={ options }
			onChange={ onChange }
			disabled={ templates.length <= 1 }
		/>
	);
}

export const TemplateEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ field.id ]: newValue,
			} ),
		[ field.id, onChange ]
	);
	const mode = useTemplateFieldMode( data );
	if ( ! mode || ! [ 'block-theme', 'classic' ].includes( mode ) ) {
		return null;
	}
	const Edit =
		mode === 'classic' ? ClassicTemplateEdit : BlockThemeTemplateEdit;
	return <Edit data={ data } field={ field } onChange={ onChangeControl } />;
};
