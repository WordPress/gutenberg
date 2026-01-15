/**
 * WordPress dependencies
 */
import {
	Card,
	CardBody,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import DataFormContext from '../../dataform-context';
import type {
	FieldLayoutProps,
	NormalizedForm,
	NormalizedLayout,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import './style.scss';

export default function FormTwoColumnsField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	const sizeCard = {
		blockStart: 'medium' as const,
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	if ( !! field.children ) {
		return (
			<div className="dataforms-layouts-two-columns__field">
				<div className="dataforms-layouts-two-columns__left">
					{ ! hideLabelFromVision && field.label && (
						<Heading level={ 2 } size={ 13 }>
							{ field.label }
						</Heading>
					) }
					{ field.description && (
						<div className="dataforms-layouts-two-columns__description">
							{ field.description }
						</div>
					) }
				</div>
				<div className="dataforms-layouts-two-columns__right">
					<Card
						className="dataforms-layouts-two-columns__card"
						size={ sizeCard }
					>
						<CardBody
							size={ sizeCard }
							className="dataforms-layouts-two-columns__card-body"
						>
							<DataFormLayout
								data={ data }
								form={ form }
								onChange={ onChange }
								validity={ validity?.children }
							/>
						</CardBody>
					</Card>
				</div>
			</div>
		);
	}

	const fieldDefinition = fields.find(
		( fieldDef ) => fieldDef.id === field.id
	);

	if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
		return null;
	}

	const RegularLayout = getFormFieldLayout( 'regular' )?.component;
	if ( ! RegularLayout ) {
		return null;
	}

	return (
		<div className="dataforms-layouts-two-columns__field">
			<div className="dataforms-layouts-two-columns__left">
				{ ! hideLabelFromVision && fieldDefinition.label && (
					<Heading level={ 2 } size={ 13 }>
						{ fieldDefinition.label }
					</Heading>
				) }
				{ field.description && (
					<div className="dataforms-layouts-two-columns__description">
						{ field.description }
					</div>
				) }
			</div>
			<div className="dataforms-layouts-two-columns__right">
				<Card
					className="dataforms-layouts-two-columns__card"
					size={ sizeCard }
				>
					<CardBody
						size={ sizeCard }
						className="dataforms-layouts-two-columns__card-body"
					>
						<RegularLayout
							data={ data }
							field={ field }
							onChange={ onChange }
							hideLabelFromVision
							validity={ validity }
						/>
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
