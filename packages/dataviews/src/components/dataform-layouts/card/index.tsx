import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
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
import getValidationMessage from '../get-validation-message';
import { getSummaryFields } from '../get-summary-fields';
import useRevealValidity from '../../../hooks/use-reveal-validity';
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
	const hasFocusedContentRef = useRef( false );

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

	// When the card is expanded after being touched (collapsed with errors),
	// reveal the field-level errors.
	const revealValidity = useRevealValidity(
		contentRef,
		( isCollapsible ? isOpen : true ) && touched
	);

	const handleContentFocus = useCallback( () => {
		hasFocusedContentRef.current = true;
	}, [] );

	// Reveal the errors of every field in the card once focus leaves the card,
	// replicating at the card level how validated controls show errors on
	// their first blur. Moving focus between fields within the card doesn't
	// count, so the natural tab sequence is preserved.
	const handleFocusOutside = useCallback( () => {
		// Leaving without ever entering the fields — for instance tabbing past
		// the header of a collapsed card — isn't an interaction to report on.
		if ( ! hasFocusedContentRef.current ) {
			return;
		}
		setTouched( true );
		// A collapsed card reveals nothing: its content is hidden but still
		// in the DOM, so the reveal would count the invalid fields and
		// announce them. The header badge already conveys them, and expanding
		// the card reveals the errors through the effect above.
		if ( isCollapsible && ! isOpen ) {
			return;
		}
		// The errors appear without moving focus, so announce them: their
		// arrival is otherwise imperceptible to assistive technology.
		const revealedCount = revealValidity();
		const message = getValidationMessage( validity );
		if ( revealedCount > 0 && message ) {
			speak( message, 'polite' );
		}
	}, [ isCollapsible, isOpen, revealValidity, validity ] );

	const focusOutsideProps = useFocusOutside( handleFocusOutside );

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
				{ ...focusOutsideProps }
			>
				<CollapsibleCard.Header>
					{ headerContent }
				</CollapsibleCard.Header>
				<CollapsibleCard.Content
					ref={ contentRef }
					onFocus={ handleContentFocus }
				>
					{ bodyContent }
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		);
	}

	return (
		<Card.Root
			className="dataforms-layouts-card__field"
			{ ...focusOutsideProps }
		>
			{ withHeader && <Card.Header>{ headerContent }</Card.Header> }
			<Card.Content ref={ contentRef } onFocus={ handleContentFocus }>
				{ bodyContent }
			</Card.Content>
		</Card.Root>
	);
}
