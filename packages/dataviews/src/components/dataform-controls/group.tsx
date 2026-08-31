/**
 * WordPress dependencies
 */
import {
	BaseControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';

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
 * Group field control.
 *
 * Groups related fields visually without requiring nested data.
 * Unlike ObjectControl, this passes data directly to properties
 * (properties use their own IDs to access root-level data).
 */
export default function GroupControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { properties } = field;

	if (
		! properties ||
		typeof properties !== 'object' ||
		Object.keys( properties ).length === 0
	) {
		return null;
	}

	// KEY DIFFERENCE from ObjectControl:
	// Pass `data` directly (not field.getValue result).
	// Properties use their own IDs to access root-level data.
	return hideLabelFromVision ? (
		<PropertiesToFields
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
			validity={ validity }
		/>
	) : (
		<fieldset className="dataviews-controls__group">
			<BaseControl.VisualLabel as="legend">
				{ field.label }
			</BaseControl.VisualLabel>
			<PropertiesToFields
				data={ data }
				field={ field }
				onChange={ onChange }
				hideLabelFromVision={ hideLabelFromVision }
				validity={ validity }
			/>
		</fieldset>
	);
}
