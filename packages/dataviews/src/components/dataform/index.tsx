/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormProps } from '../../types';
import { DataFormProvider } from '../dataform-context';
import normalizeFields from '../../field-types';
import { DataFormLayout } from '../../dataform-layouts/data-form-layout';
import normalizeForm from '../../dataform-layouts/normalize-form';

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
