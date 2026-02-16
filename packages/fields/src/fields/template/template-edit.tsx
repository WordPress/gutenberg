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
import { getDefaultTemplateLabel } from './utils';

const EMPTY_ARRAY: [] = [];

export const TemplateEdit = ( {
	data,
	field,
	onChange,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;
	const postType = data.type;

	const slug = data.slug;

	const templates = useSelect(
		( select ) => {
			return (
				select( coreStore ).getEntityRecords< WpTemplate >(
					'postType',
					'wp_template',
					{
						per_page: -1,
						post_type: postType,
					}
				) ?? EMPTY_ARRAY
			);
		},
		[ postType ]
	);

	const currentTemplateLabel = useSelect(
		( select ) => getDefaultTemplateLabel( select, postType, slug ),
		[ postType, slug ]
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
			{ label: currentTemplateLabel, value: '' },
			...templateOptions,
		];
	}, [ templates, currentTemplateLabel ] );

	return (
		<SelectControl
			__next40pxDefaultSize
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={ value }
			options={ options }
			onChange={ onChangeControl }
		/>
	);
};
