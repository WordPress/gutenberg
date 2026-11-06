import type { DataFormControlProps } from '@wordpress/dataviews';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/ui';
import { getItemTitle } from '../../shared/title/get-item-title';
import { useAvailableTemplates } from './hooks';
import type { TemplateWithTemplate } from './types';

type TemplateEditProps = DataFormControlProps< TemplateWithTemplate >;

/*
 * The value of the "no template" option. A template that is rendered on its
 * own stores an empty string, but the select reads an empty value as no
 * selection and shows its placeholder. Template slugs cannot start with a
 * slash, so this cannot clash with a real template.
 */
const NO_TEMPLATE_VALUE = '//none';

export default function TemplateEdit( {
	data,
	field,
	onChange,
}: TemplateEditProps ) {
	const templates = useAvailableTemplates( data );
	const value = field.getValue( { item: data } );
	const items = useMemo(
		() => [
			{ label: __( 'None' ), value: NO_TEMPLATE_VALUE },
			...templates.map( ( template ) => ( {
				label: getItemTitle( template ),
				value: template.slug,
			} ) ),
		],
		[ templates ]
	);
	const onValueChange = useCallback(
		( item: { value: string | null } | null ) =>
			onChange( {
				[ field.id ]:
					! item?.value || item.value === NO_TEMPLATE_VALUE
						? ''
						: item.value,
			} ),
		[ field.id, onChange ]
	);

	return (
		<SelectControl
			label={ __( 'Template' ) }
			hideLabelFromVision
			value={
				items.find(
					( item ) => item.value === ( value || NO_TEMPLATE_VALUE )
				) ??
				items[ 0 ] ??
				null
			}
			items={ items }
			onValueChange={ onValueChange }
		/>
	);
}
