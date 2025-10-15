/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type {
	Form,
	FieldLayoutProps,
	NormalizedDetailsLayout,
	DetailsLayout,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT, normalizeLayout } from '../normalize-form-fields';

export default function FormDetailsField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const layout: NormalizedDetailsLayout = normalizeLayout( {
		...field.layout,
		type: 'details',
	} as DetailsLayout ) as NormalizedDetailsLayout;

	const form: Form = useMemo(
		(): Form => ( {
			layout: DEFAULT_LAYOUT,
			fields: isCombinedField( field ) ? field.children : [],
		} ),
		[ field ]
	);

	if ( ! isCombinedField( field ) ) {
		return null;
	}

	// Find the summary field definition if specified
	const summaryFieldId = layout.summary;
	const summaryField = summaryFieldId
		? fields.find( ( fieldDef ) => fieldDef.id === summaryFieldId )
		: undefined;

	// Render the summary content
	let summaryContent;
	if ( summaryField && summaryField.render ) {
		// Use the field's render function to display the current value
		summaryContent = (
			<summaryField.render item={ data } field={ summaryField } />
		);
	} else {
		// Fall back to the label
		summaryContent = field.label || 'Add more details';
	}

	return (
		<VStack
			className="dataforms-layouts-details__field"
			spacing={ 0 }
		>
			<details className="dataforms-layouts-details__details">
				<summary className="dataforms-layouts-details__summary">
					{ summaryContent }
				</summary>
				<div className="dataforms-layouts-details__content">
					<DataFormLayout
						data={ data }
						form={ form }
						onChange={ onChange }
					/>
				</div>
			</details>
		</VStack>
	);
}
