/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	BaseControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type {
	Form,
	FieldLayoutProps,
	NormalizedRegularLayout,
} from '../../types';
import DataFormContext from '../../components/dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT, normalizeLayout } from '../normalize-form-fields';

function Header( { title }: { title: string } ) {
	return (
		<VStack className="dataforms-layouts-regular__header" spacing={ 4 }>
			<HStack alignment="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
				<Spacer />
			</HStack>
		</VStack>
	);
}

export default function FormRegularField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const form: Form = useMemo(
		(): Form => ( {
			layout: DEFAULT_LAYOUT,
			fields: isCombinedField( field ) ? field.children : [],
		} ),
		[ field ]
	);

	if ( isCombinedField( field ) ) {
		return (
			<>
				{ ! hideLabelFromVision && field.label && (
					<Header title={ field.label } />
				) }
				<DataFormLayout
					data={ data }
					form={ form }
					onChange={ onChange }
					validity={ validity?.children }
				/>
			</>
		);
	}

	const layout: NormalizedRegularLayout = normalizeLayout( {
		...field.layout,
		type: 'regular',
	} ) as NormalizedRegularLayout;

	const labelPosition = layout.labelPosition;
	const fieldDefinition = fields.find(
		( fieldDef ) => fieldDef.id === field.id
	);

	if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
		return null;
	}

	if ( labelPosition === 'side' ) {
		return (
			<HStack className="dataforms-layouts-regular__field">
				<div
					className={ clsx(
						'dataforms-layouts-regular__field-label',
						`dataforms-layouts-regular__field-label--label-position-${ labelPosition }`
					) }
				>
					{ fieldDefinition.label }
				</div>
				<div className="dataforms-layouts-regular__field-control">
					{ fieldDefinition.readOnly === true ? (
						<fieldDefinition.render
							item={ data }
							field={ fieldDefinition }
						/>
					) : (
						<fieldDefinition.Edit
							key={ fieldDefinition.id }
							data={ data }
							field={ fieldDefinition }
							onChange={ onChange }
							hideLabelFromVision
							validity={ validity }
						/>
					) }
				</div>
			</HStack>
		);
	}

	return (
		<div className="dataforms-layouts-regular__field">
			{ fieldDefinition.readOnly === true ? (
				<>
					<>
						{ ! hideLabelFromVision && labelPosition !== 'none' && (
							<BaseControl.VisualLabel>
								{ fieldDefinition.label }
							</BaseControl.VisualLabel>
						) }
						<fieldDefinition.render
							item={ data }
							field={ fieldDefinition }
						/>
					</>
				</>
			) : (
				<fieldDefinition.Edit
					data={ data }
					field={ fieldDefinition }
					onChange={ onChange }
					hideLabelFromVision={
						labelPosition === 'none' ? true : hideLabelFromVision
					}
					validity={ validity }
				/>
			) }
		</div>
	);
}
