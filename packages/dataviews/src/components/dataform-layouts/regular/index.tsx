/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	__experimentalHeading as Heading,
	BaseControl,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	NormalizedForm,
	NormalizedRegularLayout,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';

function Header( { title }: { title: string } ) {
	return (
		<Stack
			direction="column"
			className="dataforms-layouts-regular__header"
			gap="md"
		>
			<Stack direction="row" align="center">
				<Heading level={ 2 } size={ 13 }>
					{ title }
				</Heading>
			</Stack>
		</Stack>
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
	const layout = field.layout as NormalizedRegularLayout;

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT,
			fields: !! field.children ? field.children : [],
		} ),
		[ field ]
	);

	if ( !! field.children ) {
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

	const labelPosition = layout.labelPosition;
	const fieldDefinition = fields.find(
		( fieldDef ) => fieldDef.id === field.id
	);

	if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
		return null;
	}

	if ( labelPosition === 'side' ) {
		return (
			<Stack
				direction="row"
				className="dataforms-layouts-regular__field"
				gap="xs"
			>
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
			</Stack>
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
