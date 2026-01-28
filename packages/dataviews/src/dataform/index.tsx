/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormProps } from '../types';
import normalizeFields from '../field-types';
import { DataFormProvider } from '../components/dataform-context';
import { DataFormLayout } from '../components/dataform-layouts/data-form-layout';
import normalizeForm from '../components/dataform-layouts/normalize-form';

export default function DataForm< Item >( {
	data,
	form,
	fields,
	onChange,
	validity,
	settings,
}: DataFormProps< Item > ) {
	const normalizedForm = useMemo( () => normalizeForm( form ), [ form ] );
	const normalizedFields = useMemo(
		() => normalizeFields( fields, settings?.controls ),
		[ fields, settings?.controls ]
	);

	if ( ! form.fields ) {
		return null;
	}

	return (
		<DataFormProvider fields={ normalizedFields }>
			<DataFormLayout
				data={ data }
				form={ normalizedForm }
				onChange={ onChange }
				validity={ validity }
			/>
		</DataFormProvider>
	);
}
