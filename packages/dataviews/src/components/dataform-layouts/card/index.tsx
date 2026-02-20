/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardHeader as OriginalCardHeader,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';

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
	const cardBodyRef = useRef< HTMLDivElement >( null );
	const bodyId = useInstanceId(
		FormCardField,
		'dataforms-layouts-card-card-body'
	);

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	const { isOpened, isCollapsible } = layout;
	const [ internalIsOpen, setIsOpen ] = useState( isOpened );
	const [ touched, setTouched ] = useState( false );

	// Sync internal state when the isOpened prop changes.
	// This is unlikely to happen in production, but it helps with storybook controls.
	useEffect( () => {
		setIsOpen( isOpened );
	}, [ isOpened ] );

	const toggle = useCallback( () => {
		setIsOpen( ( prev ) => {
			// Mark as touched when collapsing (going from open to closed)
			if ( prev ) {
				setTouched( true );
			}
			return ! prev;
		} );
	}, [] );

	const isOpen = isCollapsible ? internalIsOpen : true;

	// Mark the card as touched when any field inside it is blurred.
	// This aligns with how validated controls show errors on blur.
	const handleBlur = useCallback( () => {
		setTouched( true );
	}, [ setTouched ] );

	// When the card is expanded after being touched (collapsed with errors),
	// trigger reportValidity to show field-level errors.
	useReportValidity( cardBodyRef, isOpen && touched );

	const summaryFields = getSummaryFields< Item >( layout.summary, fields );

	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, isOpen )
	);

	const validationBadge =
		touched && layout.isCollapsible ? (
			<ValidationBadge validity={ validity } />
		) : null;

	const sizeCard = {
		blockStart: 'medium' as const,
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	let label = field.label;
	let withHeader: boolean;
	let bodyContent: React.ReactNode;

	if ( field.children ) {
		withHeader = !! label && layout.withHeader;
		bodyContent = (
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
	} else {
		const fieldDefinition = fields.find(
			( fieldDef ) => fieldDef.id === field.id
		);

		if ( ! fieldDefinition || ! fieldDefinition.Edit ) {
			return null;
		}

		const SingleFieldLayout = getFormFieldLayout( 'regular' )?.component;
		if ( ! SingleFieldLayout ) {
			return null;
		}

		label = fieldDefinition.label;
		withHeader = !! label && layout.withHeader;
		bodyContent = (
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

	const sizeCardBody = {
		blockStart: withHeader ? ( 'none' as const ) : ( 'medium' as const ),
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	return (
		<Card className="dataforms-layouts-card__field" size={ sizeCard }>
			{ withHeader && (
				<OriginalCardHeader
					className="dataforms-layouts-card__field-header"
					onClick={ isCollapsible ? toggle : undefined }
					style={ {
						cursor: isCollapsible ? 'pointer' : undefined,
					} }
					isBorderless
				>
					<div
						style={ {
							// Match the expand/collapse button's height to avoid layout
							// differences when that button is not displayed.
							height: isCollapsible ? undefined : '40px',
							width: '100%',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						} }
					>
						<span className="dataforms-layouts-card__field-header-label">
							{ label }
						</span>
						{ validationBadge }
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
					</div>
					{ isCollapsible && (
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							icon={ isOpen ? chevronUp : chevronDown }
							aria-expanded={ isOpen }
							aria-controls={ bodyId }
							aria-label={
								isOpen ? __( 'Collapse' ) : __( 'Expand' )
							}
						/>
					) }
				</OriginalCardHeader>
			) }
			{ ( isOpen || ! withHeader ) && (
				// If it doesn't have a header, keep it open.
				// Otherwise, the card will not be visible.
				<CardBody
					id={ bodyId }
					size={ sizeCardBody }
					className="dataforms-layouts-card__field-control"
					ref={ cardBodyRef }
					onBlur={ handleBlur }
				>
					{ bodyContent }
				</CardBody>
			) }
		</Card>
	);
}
