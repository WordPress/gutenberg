import { useMemo } from '@wordpress/element';
import type { DataFormProps } from '../types';
import normalizeFields, { canFieldsUseUiOverlays } from '../field-types';
import { useUiOverlaySupport } from './use-ui-overlay-support';
import { DataFormProvider } from '../components/dataform-context';
import { DataFormLayout } from '../components/dataform-layouts/data-form-layout';
import normalizeForm from '../components/dataform-layouts/normalize-form';

/**
 * `DataForm` renders an auto-generated form for viewing and editing the fields
 * of a data item, driven by a fields and form layout configuration. Use it to
 * edit items of a dataset, often alongside `DataViews`.
 */
export default function DataForm< Item >( {
	data,
	form,
	fields,
	onChange,
	validity,
}: DataFormProps< Item > ) {
	const normalizedForm = useMemo( () => normalizeForm( form ), [ form ] );
	const normalizedFields = useMemo(
		() => normalizeFields( fields ),
		[ fields ]
	);
	const supportsUiOverlays = useUiOverlaySupport( fields );

	if ( ! form.fields ) {
		return null;
	}

	return (
		<DataFormProvider
			fields={ normalizedFields }
			supportsUiOverlays={ supportsUiOverlays }
		>
			<DataFormLayout
				data={ data }
				form={ normalizedForm }
				onChange={ onChange }
				validity={ validity }
			/>
		</DataFormProvider>
	);
}

/** Whether the supplied fields and runtime can be hosted in a UI overlay. */
DataForm.canUseUiOverlays = canFieldsUseUiOverlays;
