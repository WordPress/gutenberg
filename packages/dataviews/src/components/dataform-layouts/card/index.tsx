import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { Card, CollapsibleCard } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import type {
	FieldLayoutProps,
	NormalizedCardLayout,
	NormalizedField,
	NormalizedForm,
	NormalizedLayout,
} from '../../../types';
import DataFormContext from '../../dataform-context';
import { DataFormLayout } from '../data-form-layout';
import { getSummaryFields } from '../get-summary-fields';
import { DEFAULT_LAYOUT } from '../normalize-form';

function isSummaryFieldVisible< Item >(
	summaryField: NormalizedField< Item >,
	summaryConfig: NormalizedCardLayout[ 'summary' ],
	isOpen: boolean
) {
	// If no summary config, dont't show any fields
	if (
		! summaryConfig ||
		( Array.isArray( summaryConfig ) && summaryConfig.length === 0 )
	) {
		return false;
	}

	// Convert to array for consistent handling
	const summaryConfigArray = Array.isArray( summaryConfig )
		? summaryConfig
		: [ summaryConfig ];

	// Find the config for this specific field
	const fieldConfig = summaryConfigArray.find( ( config ) => {
		if ( typeof config === 'string' ) {
			return config === summaryField.id;
		}
		if ( typeof config === 'object' && 'id' in config ) {
			return config.id === summaryField.id;
		}
		return false;
	} );

	// If field is not in summary config, don't show it
	if ( ! fieldConfig ) {
		return false;
	}

	// If it's a string, always show it
	if ( typeof fieldConfig === 'string' ) {
		return true;
	}

	// If it has visibility rules, respect them
	if ( typeof fieldConfig === 'object' && 'visibility' in fieldConfig ) {
		return (
			fieldConfig.visibility === 'always' ||
			( fieldConfig.visibility === 'when-collapsed' && ! isOpen )
		);
	}

	// Default to always show
	return true;
}

export default function FormCardField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );
	const layout = field.layout as NormalizedCardLayout;

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	const { isOpened, isCollapsible } = layout;
	const [ isOpen, setIsOpen ] = useState( isOpened );

	const onOpenChange = useCallback( ( nextOpen: boolean ) => {
		setIsOpen( nextOpen );
	}, [] );

	const effectiveIsOpen = isCollapsible ? isOpen : true;

	const summaryFields = getSummaryFields< Item >( layout.summary, fields );

	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, effectiveIsOpen )
	);

	const Summary = visibleSummaryFields.length > 0 && layout.withHeader && (
		<span className="dataforms-layouts-card__field-summary">
			{ visibleSummaryFields.map( ( summaryField ) => (
				<summaryField.render
					key={ summaryField.id }
					item={ data }
					field={ summaryField }
				/>
			) ) }
		</span>
	);

	if ( !! field.children ) {
		const withHeader = !! field.label && layout.withHeader;

		const content = (
			<>
				{ field.description && (
					<div className="dataforms-layouts-card__field-description">
						{ field.description }
					</div>
				) }
				<DataFormLayout
					data={ data }
					form={ form }
					onChange={ onChange }
					validity={ validity?.children }
				/>
			</>
		);

		if ( isCollapsible && withHeader ) {
			return (
				<CollapsibleCard
					className="dataforms-layouts-card__field"
					open={ effectiveIsOpen }
					onOpenChange={ onOpenChange }
					title={
						<span className="dataforms-layouts-card__field-header-label">
							{ field.label }
						</span>
					}
					summary={ Summary || undefined }
					toggleLabel={ effectiveIsOpen ? 'Collapse' : 'Expand' }
				>
					{ content }
				</CollapsibleCard>
			);
		}

		return (
			<Card className="dataforms-layouts-card__field">
				{ withHeader && (
					<Card.Header className="dataforms-layouts-card__field-header">
						<span className="dataforms-layouts-card__field-header-label">
							{ field.label }
						</span>
						{ Summary }
					</Card.Header>
				) }
				{ ( effectiveIsOpen || ! withHeader ) && (
					// If it doesn't have a header, keep it open.
					// Otherwise, the card will not be visible.
					<Card.Body className="dataforms-layouts-card__field-control">
						{ content }
					</Card.Body>
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

	const content = (
		<RegularLayout
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision || withHeader }
			validity={ validity }
		/>
	);

	if ( isCollapsible && withHeader ) {
		return (
			<CollapsibleCard
				className="dataforms-layouts-card__field"
				open={ effectiveIsOpen }
				onOpenChange={ onOpenChange }
				title={ fieldDefinition.label }
				summary={ Summary || undefined }
				toggleLabel={ effectiveIsOpen ? 'Collapse' : 'Expand' }
			>
				{ content }
			</CollapsibleCard>
		);
	}

	return (
		<Card className="dataforms-layouts-card__field">
			{ withHeader && (
				<Card.Header className="dataforms-layouts-card__field-header">
					<span className="dataforms-layouts-card__field-header-label">
						{ fieldDefinition.label }
					</span>
					{ Summary }
				</Card.Header>
			) }
			{ ( effectiveIsOpen || ! withHeader ) && (
				// If it doesn't have a header, keep it open.
				// Otherwise, the card will not be visible.
				<Card.Body className="dataforms-layouts-card__field-control">
					{ content }
				</Card.Body>
			) }
		</Card>
	);
}
