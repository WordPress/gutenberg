/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Form, SimpleFormField, FormField, FieldValidity } from '../types';
import { getFormFieldLayout } from './index';
import DataFormContext from '../components/dataform-context';
import { isCombinedField } from './is-combined-field';
import normalizeFormFields, { normalizeLayout } from './normalize-form-fields';

const DEFAULT_WRAPPER = ( { children }: { children: React.ReactNode } ) => (
	<VStack className="dataforms-layouts__wrapper" spacing={ 4 }>
		{ children }
	</VStack>
);

export function DataFormLayout< Item >( {
	data,
	form,
	onChange,
	children,
	as,
}: {
	data: Item;
	form: Form;
	onChange: ( value: any ) => void;
	children?: (
		FieldLayout: ( props: {
			data: Item;
			field: FormField;
			onChange: ( value: any ) => void;
			hideLabelFromVision?: boolean;
			validity?: FieldValidity;
		} ) => React.JSX.Element | null,
		field: FormField
	) => React.JSX.Element;
	as?: React.ComponentType< { children: React.ReactNode } >;
} ) {
	const { fields: fieldDefinitions, validity } =
		useContext( DataFormContext );

	function getFieldDefinition( field: SimpleFormField | string ) {
		const fieldId = typeof field === 'string' ? field : field.id;

		return fieldDefinitions.find(
			( fieldDefinition ) => fieldDefinition.id === fieldId
		);
	}

	const normalizedFormFields = useMemo(
		() => normalizeFormFields( form ),
		[ form ]
	);

	const normalizedFormLayout = normalizeLayout( form.layout );
	const Wrapper =
		as ??
		getFormFieldLayout( normalizedFormLayout.type )?.wrapper ??
		DEFAULT_WRAPPER;

	return (
		<Wrapper layout={ normalizedFormLayout }>
			{ normalizedFormFields.map( ( formField ) => {
				const FieldLayout = getFormFieldLayout( formField.layout.type )
					?.component;

				if ( ! FieldLayout ) {
					return null;
				}

				const fieldDefinition = ! isCombinedField( formField )
					? getFieldDefinition( formField )
					: undefined;

				if (
					fieldDefinition &&
					fieldDefinition.isVisible &&
					! fieldDefinition.isVisible( data )
				) {
					return null;
				}

				if ( children ) {
					return children(
						( props ) => (
							<FieldLayout
								{ ...props }
								validity={ validity?.find(
									( item ) => item.id === formField.id
								) }
							/>
						),
						formField
					);
				}

				const fieldValidity = validity?.find(
					( item ) => item.id === formField.id
				);
				return (
					<FieldLayout
						key={ formField.id }
						data={ data }
						field={ formField }
						onChange={ onChange }
						validity={ fieldValidity }
					/>
				);
			} ) }
		</Wrapper>
	);
}
