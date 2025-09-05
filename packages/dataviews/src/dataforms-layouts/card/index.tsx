/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { Button, Card, CardBody, CardHeader } from '@wordpress/components';
import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import DataFormContext from '../../components/dataform-context';
import type { NormalizedCardLayout, FieldLayoutProps, Form } from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT, normalizeLayout } from '../../normalize-form-fields';

export function useCollapsibleCard( initialIsOpen: boolean = true ) {
	const [ isOpen, setIsOpen ] = useState( initialIsOpen );

	const toggle = useCallback( () => {
		setIsOpen( ( prev ) => ! prev );
	}, [] );

	const CollapsibleCardHeader = useCallback(
		( {
			children,
			...props
		}: {
			children: React.ReactNode;
			[ key: string ]: any;
		} ) => (
			<CardHeader
				{ ...props }
				onClick={ toggle }
				style={ {
					cursor: 'pointer',
					...props.style,
				} }
			>
				<div
					style={ {
						width: '100%',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					} }
				>
					{ children }
				</div>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					icon={ isOpen ? chevronUp : chevronDown }
					aria-expanded={ isOpen }
					aria-label={ isOpen ? 'Collapse' : 'Expand' }
				/>
			</CardHeader>
		),
		[ toggle, isOpen ]
	);

	return { isOpen, CollapsibleCardHeader };
}

export default function FormCardField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );

	const layout: NormalizedCardLayout = normalizeLayout( {
		...field.layout,
		type: 'card',
	} ) as NormalizedCardLayout;

	const form: Form = useMemo(
		(): Form => ( {
			layout: DEFAULT_LAYOUT,
			fields: isCombinedField( field ) ? field.children : [],
		} ),
		[ field ]
	);

	const { isOpen, CollapsibleCardHeader } = useCollapsibleCard(
		layout.isOpened
	);
	if ( isCombinedField( field ) ) {
		const withHeader = !! field.label && layout.withHeader;
		return (
			<Card className="dataforms-layouts-card__field">
				{ withHeader && (
					<CollapsibleCardHeader className="dataforms-layouts-card__field-label">
						{ field.label }
					</CollapsibleCardHeader>
				) }
				{ ( isOpen || ! withHeader ) && (
					// If it doesn't have a header, keep it open.
					// Otherwise, the card will not be visible.
					<CardBody className="dataforms-layouts-card__field-control">
						{ field.description && (
							<div className="dataforms-layouts-card__field-description">
								{ field.description }
							</div>
						) }
						<DataFormLayout
							data={ data }
							form={ form }
							onChange={ onChange }
						/>
					</CardBody>
				) }
			</Card>
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
	const withHeader = !! fieldDefinition.label && layout.withHeader;
	return (
		<Card className="dataforms-layouts-card__field">
			{ withHeader && (
				<CollapsibleCardHeader className="dataforms-layouts-card__field-label">
					{ fieldDefinition.label }
				</CollapsibleCardHeader>
			) }
			{ ( isOpen || ! withHeader ) && (
				// If it doesn't have a header, keep it open.
				// Otherwise, the card will not be visible.
				<CardBody className="dataforms-layouts-card__field-control">
					<RegularLayout
						data={ data }
						field={ field }
						onChange={ onChange }
						hideLabelFromVision={
							hideLabelFromVision || withHeader
						}
					/>
				</CardBody>
			) }
		</Card>
	);
}
