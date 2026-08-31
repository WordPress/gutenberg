/**
 * WordPress dependencies
 */
import {
	BaseControl,
	VisuallyHidden,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps, DeepPartial } from '../../types';

function PropertiesToFields< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { properties } = field;
	return (
		<VStack spacing={ 4 }>
			{ Object.entries( properties ).map( ( [ propKey, propField ] ) => {
				if ( ! propField.Edit ) {
					return null;
				}

				return (
					<propField.Edit
						key={ propKey }
						data={ data }
						field={ propField }
						onChange={ onChange }
						hideLabelFromVision={ hideLabelFromVision }
						validity={ validity }
					/>
				);
			} ) }
		</VStack>
	);
}

/**
 * Object field control.
 *
 * Auto-generates a form with controls for each property in `properties`.
 */
export default function ObjectControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { properties } = field;

	const currentValue = field.getValue( { item: data } ) ?? {};
	const handlePropertyChange = useCallback(
		( updates: DeepPartial< Item > ) => {
			onChange(
				field.setValue( {
					item: data,
					value: { ...currentValue, ...updates },
				} )
			);
		},
		[ onChange ]
	);

	if (
		! properties ||
		typeof properties !== 'object' ||
		Object.keys( properties ).length === 0
	) {
		return null;
	}

	return hideLabelFromVision ? (
		<PropertiesToFields
			data={ currentValue }
			field={ field }
			onChange={ handlePropertyChange }
			hideLabelFromVision={ hideLabelFromVision }
			validity={ validity }
		/>
	) : (
		<fieldset className="dataviews-controls__object">
			<BaseControl.VisualLabel as="legend">
				{ field.label }
			</BaseControl.VisualLabel>
			<PropertiesToFields
				data={ currentValue }
				field={ field }
				onChange={ handlePropertyChange }
				hideLabelFromVision={ hideLabelFromVision }
				validity={ validity }
			/>
		</fieldset>
	);
}
