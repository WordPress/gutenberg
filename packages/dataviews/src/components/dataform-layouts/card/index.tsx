/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
// TODO: enable in the ESlint rule once we complete
// https://github.com/WordPress/gutenberg/issues/76135.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import DataFormContext from '../../dataform-context';
import type {
	FieldLayoutProps,
	NormalizedCardLayout,
	NormalizedField,
	NormalizedForm,
	NormalizedLayout,
} from '../../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import { getSummaryFields } from '../get-summary-fields';
import useReportValidity from '../../../hooks/use-report-validity';
import ValidationBadge from '../validation-badge';

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

function HeaderContent< Item >( {
	data,
	fields,
	label,
	layout,
	isOpen,
	touched,
	validity,
}: {
	data: Item;
	fields: NormalizedField< Item >[];
	label: string | undefined;
	layout: NormalizedCardLayout;
	isOpen: boolean;
	touched: boolean;
	validity: FieldLayoutProps< Item >[ 'validity' ];
} ) {
	const summaryFields = getSummaryFields< Item >( layout.summary, fields );

	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, isOpen )
	);

	const hasBadge = touched && layout.isCollapsible;
	const hasSummary = visibleSummaryFields.length > 0 && layout.withHeader;

	return (
		<Stack
			align="center"
			justify="space-between"
			className="dataforms-layouts-card__field-header-content"
		>
			<Card.Title>{ label }</Card.Title>
			{ ( hasBadge || hasSummary ) && (
				<CollapsibleCard.HeaderDescription className="dataforms-layouts-card__field-header-content-description">
					{ hasBadge && <ValidationBadge validity={ validity } /> }
					{ hasSummary && (
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
				</CollapsibleCard.HeaderDescription>
			) }
		</Stack>
	);
}

function BodyContent< Item >( {
	data,
	field,
	form,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
	withHeader,
}: {
	data: Item;
	field: FieldLayoutProps< Item >[ 'field' ];
	form: NormalizedForm;
	onChange: FieldLayoutProps< Item >[ 'onChange' ];
	hideLabelFromVision?: boolean;
	markWhenOptional?: boolean;
	validity: FieldLayoutProps< Item >[ 'validity' ];
	withHeader: boolean;
} ) {
	if ( field.children ) {
		return (
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
	}

	const SingleFieldLayout = getFormFieldLayout( 'regular' )?.component;
	if ( ! SingleFieldLayout ) {
		return null;
	}

	return (
		<SingleFieldLayout
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision || withHeader }
			markWhenOptional={ markWhenOptional }
			validity={ validity }
		/>
	);
}

export default function FormCardField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: FieldLayoutProps< Item > ) {
	const { fields } = useContext( DataFormContext );
	const layout = field.layout as NormalizedCardLayout;
	const contentRef = useRef< HTMLDivElement >( null );

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	const { isOpened, isCollapsible } = layout;
	const [ isOpen, setIsOpen ] = useState( isOpened );
	const [ touched, setTouched ] = useState( false );

	// Sync internal state when the isOpened prop changes.
	// This is unlikely to happen in production, but it helps with storybook controls.
	useEffect( () => {
		setIsOpen( isOpened );
	}, [ isOpened ] );

	const handleOpenChange = useCallback( ( open: boolean ) => {
		// Mark as touched when collapsing (going from open to closed)
		if ( ! open ) {
			setTouched( true );
		}
		setIsOpen( open );
	}, [] );

	// Mark the card as touched when any field inside it is blurred.
	// This aligns with how validated controls show errors on blur.
	const handleBlur = useCallback( () => {
		setTouched( true );
	}, [] );

	// When the card is expanded after being touched (collapsed with errors),
	// trigger reportValidity to show field-level errors.
	useReportValidity(
		contentRef,
		( isCollapsible ? isOpen : true ) && touched
	);

	let label = field.label;
	let withHeader: boolean;

	if ( field.children ) {
		withHeader = !! label && layout.withHeader;
	} else {
		const fieldDefinition = fields.find(
			( fieldDef ) => fieldDef.id === field.id
		);

		if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
			return null;
		}

		label = fieldDefinition.label;
		withHeader = !! label && layout.withHeader;
	}

	const bodyContent = (
		<BodyContent
			data={ data }
			field={ field }
			form={ form }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
			markWhenOptional={ markWhenOptional }
			validity={ validity }
			withHeader={ withHeader }
		/>
	);

	const headerContent = (
		<HeaderContent
			data={ data }
			fields={ fields }
			label={ label }
			layout={ layout }
			isOpen={ isCollapsible ? !! isOpen : true }
			touched={ touched }
			validity={ validity }
		/>
	);

	if ( withHeader && isCollapsible ) {
		return (
			<CollapsibleCard.Root
				className="dataforms-layouts-card__field"
				open={ isOpen }
				onOpenChange={ handleOpenChange }
			>
				<CollapsibleCard.Header>
					{ headerContent }
				</CollapsibleCard.Header>
				<CollapsibleCard.Content
					ref={ contentRef }
					onBlur={ handleBlur }
				>
					{ bodyContent }
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		);
	}

	return (
		<Card.Root className="dataforms-layouts-card__field">
			{ withHeader && <Card.Header>{ headerContent }</Card.Header> }
			<Card.Content ref={ contentRef } onBlur={ handleBlur }>
				{ bodyContent }
			</Card.Content>
		</Card.Root>
	);
}
