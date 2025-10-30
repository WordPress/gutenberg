/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardHeader as OriginalCardHeader,
} from '@wordpress/components';
import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import DataFormContext from '../../components/dataform-context';
import type {
	NormalizedCardLayout,
	CardLayout,
	FieldLayoutProps,
	Form,
	Layout,
	NormalizedField,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { isCombinedField } from '../is-combined-field';
import { DEFAULT_LAYOUT, normalizeLayout } from '../normalize-form-fields';
import { getSummaryFields } from '../get-summary-fields';

const NonCollapsibleCardHeader = ( {
	children,
	...props
}: {
	children: React.ReactNode;
} ) => (
	<OriginalCardHeader { ...props }>
		<div
			style={ {
				height: '40px', // This is to match the chevron's __next40pxDefaultSize
				width: '100%',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			} }
		>
			{ children }
		</div>
	</OriginalCardHeader>
);

export function useCardHeader( layout: NormalizedCardLayout ) {
	const { isOpened, isCollapsible } = layout;
	const [ isOpen, setIsOpen ] = useState( isOpened );

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
			<OriginalCardHeader
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
			</OriginalCardHeader>
		),
		[ toggle, isOpen ]
	);

	const effectiveIsOpen = isCollapsible ? isOpen : true;
	const CardHeaderComponent = isCollapsible
		? CollapsibleCardHeader
		: NonCollapsibleCardHeader;

	return { isOpen: effectiveIsOpen, CardHeader: CardHeaderComponent };
}

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

	const layout: NormalizedCardLayout = normalizeLayout( {
		...field.layout,
		type: 'card',
	} as CardLayout ) as NormalizedCardLayout;

	const form: Form = useMemo(
		(): Form => ( {
			layout: DEFAULT_LAYOUT as Layout,
			fields: isCombinedField( field ) ? field.children : [],
		} ),
		[ field ]
	);

	const { isOpen, CardHeader } = useCardHeader( layout );

	const summaryFields = getSummaryFields< Item >( layout.summary, fields );

	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, isOpen )
	);

	if ( isCombinedField( field ) ) {
		const withHeader = !! field.label && layout.withHeader;

		return (
			<Card className="dataforms-layouts-card__field">
				{ withHeader && (
					<CardHeader className="dataforms-layouts-card__field-header">
						<span className="dataforms-layouts-card__field-header-label">
							{ field.label }
						</span>
						{ visibleSummaryFields.length > 0 &&
							layout.withHeader && (
								<div className="dataforms-layouts-card__field-summary">
									{ visibleSummaryFields.map(
										( summaryField ) => (
											<summaryField.render
												key={ summaryField.id }
												item={ data }
												field={ summaryField }
											/>
										)
									) }
								</div>
							) }
					</CardHeader>
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
							validity={ validity?.children }
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
				<CardHeader className="dataforms-layouts-card__field-header">
					<span className="dataforms-layouts-card__field-header-label">
						{ fieldDefinition.label }
					</span>
					{ visibleSummaryFields.length > 0 && layout.withHeader && (
						<div className="dataforms-layouts-card__field-summary">
							{ visibleSummaryFields.map( ( summaryField ) => (
								<summaryField.render
									key={ summaryField.id }
									item={ data }
									field={ summaryField }
								/>
							) ) }
						</div>
					) }
				</CardHeader>
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
						validity={ validity }
					/>
				</CardBody>
			) }
		</Card>
	);
}
