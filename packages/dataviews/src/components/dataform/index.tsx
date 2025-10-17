/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormProps } from '../../types';
import { DataFormProvider } from '../dataform-context';
import normalizeFields from '../../utils/normalize-fields';
import { DataFormLayout } from '../../dataform-layouts/data-form-layout';

export default function DataForm< Item >( {
	data,
	form,
	fields,
	onChange,
	validity,
}: DataFormProps< Item > ) {
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
				form={ form }
				onChange={ onChange }
				validity={ validity }
			/>
		</DataFormProvider>
	);
}
