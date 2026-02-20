/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../actions/utils';
import type { BasePost } from '../../types';
import { useDefaultTemplateLabel } from './hooks';
import { unlock } from '../../lock-unlock';

const EMPTY_ARRAY: [] = [];

export const TemplateEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;
	const postType = data.type;
	const postId =
		typeof data.id === 'number' ? data.id : parseInt( data.id, 10 );
	const slug = data.slug;

	const { templates, canSwitchTemplate } = useSelect(
		( select ) => {
			const allTemplates =
				select( coreStore ).getEntityRecords< WpTemplate >(
					'postType',
					'wp_template',
					{
						per_page: -1,
						post_type: postType,
					}
				) ?? EMPTY_ARRAY;

			const { getHomePage, getPostsPageId } = unlock(
				select( coreStore )
			);
			const singlePostId = String( postId );
			const isPostsPage =
				singlePostId !== undefined && getPostsPageId() === singlePostId;
			const isFrontPage =
				singlePostId !== undefined &&
				postType === 'page' &&
				getHomePage()?.postId === singlePostId;

			return {
				templates: allTemplates,
				canSwitchTemplate: ! isPostsPage && ! isFrontPage,
			};
		},
		[ postId, postType ]
	);

	const defaultTemplateLabel = useDefaultTemplateLabel(
		postType,
		postId,
		slug
	);

	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	const options = useMemo( () => {
		const templateOptions = templates.map( ( template ) => ( {
			label: getItemTitle( template ),
			value: template.slug,
		} ) );
		return [
			{ label: defaultTemplateLabel, value: '' },
			...templateOptions,
		];
	}, [ templates, defaultTemplateLabel ] );

	return (
		<SelectControl
			__next40pxDefaultSize
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={ value }
			options={ options }
			onChange={ onChangeControl }
			disabled={ ! canSwitchTemplate }
		/>
	);
};
