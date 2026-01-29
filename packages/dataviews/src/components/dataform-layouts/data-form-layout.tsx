/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	FormValidity,
	NormalizedForm,
	NormalizedFormField,
} from '../../types';
import { getFormFieldLayout } from './index';
import DataFormContext from '../dataform-context';

const DEFAULT_WRAPPER = ( { children }: { children: React.ReactNode } ) => (
	<Stack direction="column" className="dataforms-layouts__wrapper" gap="lg">
		{ children }
	</Stack>
);

export function DataFormLayout< Item >( {
	data,
	form,
	onChange,
	validity,
	children,
	as,
}: {
	data: Item;
	form: NormalizedForm;
	onChange: ( value: any ) => void;
	validity?: FormValidity;
	children?: (
		FieldLayout: ( props: {
			data: Item;
			field: NormalizedFormField;
			onChange: ( value: any ) => void;
			hideLabelFromVision?: boolean;
			validity?: FieldValidity;
		} ) => React.JSX.Element | null,
		childField: NormalizedFormField,
		childFieldValidity?: FieldValidity
	) => React.JSX.Element;
	as?: React.ComponentType< { children: React.ReactNode } >;
} ) {
	const { fields: fieldDefinitions } = useContext( DataFormContext );

	function getFieldDefinition( field: NormalizedFormField ) {
		return fieldDefinitions.find(
			( fieldDefinition ) => fieldDefinition.id === field.id
		);
	}

	const Wrapper =
		as ??
		getFormFieldLayout( form.layout.type )?.wrapper ??
		DEFAULT_WRAPPER;

	return (
		<Wrapper layout={ form.layout }>
			{ form.fields.map( ( formField ) => {
				const FieldLayout = getFormFieldLayout( formField.layout.type )
					?.component;

				if ( ! FieldLayout ) {
					return null;
				}

				const fieldDefinition = ! formField.children
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
						FieldLayout,
						formField,
						validity?.[ formField.id ]
					);
				}

				return (
					<FieldLayout
						key={ formField.id }
						data={ data }
						field={ formField }
						onChange={ onChange }
						validity={ validity?.[ formField.id ] }
					/>
				);
			} ) }
		</Wrapper>
	);
}
