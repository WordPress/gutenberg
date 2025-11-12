/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { FieldLayoutProps, Form, NormalizedRowLayout } from '../../types';
import DataFormContext from '../../components/dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { normalizeLayout } from '../normalize-form-fields';
import { getFormFieldLayout } from '..';

function Header( { title }: { title: string } ) {
	return (
		<VStack className="dataforms-layouts-row__header" spacing={ 4 }>
			<HStack alignment="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
				<Spacer />
			</HStack>
		</VStack>
	);
}

const EMPTY_WRAPPER = ( { children }: { children: React.ReactNode } ) => (
	<>{ children }</>
);

export default function FormRowField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const layout = normalizeLayout( {
		...field.layout,
		type: 'row',
	} ) as NormalizedRowLayout;

	if ( isCombinedField( field ) ) {
		const form: Form = {
			fields: field.children.map( ( child ) => {
				if ( typeof child === 'string' ) {
					return { id: child };
				}
				return child;
			} ),
		};

		return (
			<div className="dataforms-layouts-row__field">
				{ ! hideLabelFromVision && field.label && (
					<Header title={ field.label } />
				) }
				<HStack alignment={ layout.alignment } spacing={ 4 }>
					<DataFormLayout
						data={ data }
						form={ form }
						onChange={ onChange }
						validity={ validity?.children }
						as={ EMPTY_WRAPPER }
					>
						{ ( FieldLayout, childField, childFieldValidity ) => (
							<div
								key={ childField.id }
								className="dataforms-layouts-row__field-control"
								style={ layout.styles[ childField.id ] }
							>
								<FieldLayout
									data={ data }
									field={ childField }
									onChange={ onChange }
									hideLabelFromVision={ hideLabelFromVision }
									validity={ childFieldValidity }
								/>
							</div>
						) }
					</DataFormLayout>
				</HStack>
			</div>
		);
	}

	const fieldDefinition = fields.find( ( f ) => f.id === field.id );

	if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
		return null;
	}

	const RegularLayout = getFormFieldLayout( 'regular' )?.component;
	if ( ! RegularLayout ) {
		return null;
	}

	return (
		<>
			<div className="dataforms-layouts-row__field-control">
				<RegularLayout
					data={ data }
					field={ fieldDefinition }
					onChange={ onChange }
					validity={ validity }
				/>
			</div>
		</>
	);
}
