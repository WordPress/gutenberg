/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	NormalizedForm,
	NormalizedDetailsLayout,
	FieldLayoutProps,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';

export default function FormDetailsField< Item >( {
	data,
	field,
	onChange,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	if ( ! field.children ) {
		return null;
	}

	// Find the summary field definition if specified
	const summaryFieldId =
		( field.layout as NormalizedDetailsLayout ).summary ?? '';
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
		summaryContent = field.label || __( 'More details' );
	}

	return (
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
	);
}
