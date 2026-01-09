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
}: DataFormProps< Item > ) {
	const normalizedForm = useMemo( () => normalizeForm( form ), [ form ] );
	const normalizedFields = useMemo(
		() => normalizeFields( fields ),
		[ fields ]
	);

	// Calculate required count for stable dependency
	const requiredCount = useMemo(
		() => normalizedFields.filter( ( f ) => !! f.isValid?.required ).length,
		[ normalizedFields ]
	);

	// Resolve labelMode (handles 'auto')
	const effectiveLabelMode: 'showRequired' | 'showOptional' = useMemo( () => {
		if ( form.labelMode === 'showOptional' ) return 'showOptional';
		if ( form.labelMode === 'showRequired' ) return 'showRequired';
		if ( form.labelMode === 'auto' ) {
			const optionalCount = normalizedFields.length - requiredCount;
			return requiredCount >= optionalCount ? 'showOptional' : 'showRequired';
		}
		return 'showRequired';
	}, [ form.labelMode, requiredCount, normalizedFields.length ] );

	// Merge resolved labelMode into form
	const formWithResolvedLabelMode = useMemo(
		() => ( { ...normalizedForm, labelMode: effectiveLabelMode } ),
		[ normalizedForm, effectiveLabelMode ]
	);

	if ( ! form.fields ) {
		return null;
	}

	return (
		<DataFormProvider fields={ normalizedFields }>
			<DataFormLayout
				data={ data }
				form={ formWithResolvedLabelMode }
				onChange={ onChange }
				validity={ validity }
			/>
		</DataFormProvider>
	);
}
