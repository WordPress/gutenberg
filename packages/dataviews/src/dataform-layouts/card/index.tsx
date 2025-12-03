/**
 * External dependencies
 */
import type { ReactNode, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardHeader as OriginalCardHeader,
} from '@wordpress/components';
import {
	useCallback,
	useContext,
	useMemo,
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getFormFieldLayout } from '..';
import DataFormContext from '../../components/dataform-context';
import type {
	FieldLayoutProps,
	NormalizedCardLayout,
	NormalizedField,
	NormalizedForm,
	NormalizedLayout,
} from '../../types';
import { DataFormLayout } from '../data-form-layout';
import { DEFAULT_LAYOUT } from '../normalize-form';
import { getSummaryFields } from '../get-summary-fields';

/* ---------- Card Header Component ---------- */

interface CardHeaderProps {
	children: ReactNode;
	isCollapsible?: boolean;
	isOpen: boolean;
	onToggle: () => void;
	controlsId?: string;
	className?: string;
}

const CardHeader = ( {
	children,
	isCollapsible = false,
	isOpen,
	onToggle,
	controlsId,
	className,
}: CardHeaderProps ) => {
	const buttonRef = useRef< HTMLButtonElement >( null );
	const prevIsOpenRef = useRef( isOpen );

	// Focus BEFORE paint to avoid flicker
	useLayoutEffect( () => {
		if ( isCollapsible && prevIsOpenRef.current !== isOpen ) {
			buttonRef.current?.focus();
		}
		prevIsOpenRef.current = isOpen;
	}, [ isOpen, isCollapsible ] );

	return (
		<OriginalCardHeader isBorderless className={ className }>
			<div
				style={ {
					width: '100%',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				} }
			>
				{ children }
				{ isCollapsible && (
					<Button
						ref={ buttonRef }
						type="button"
						__next40pxDefaultSize
						variant="tertiary"
						icon={ isOpen ? chevronUp : chevronDown }
						aria-expanded={ isOpen }
						aria-controls={ isOpen ? controlsId : undefined }
						aria-label={
							isOpen ? __( 'Collapse' ) : __( 'Expand' )
						}
						onClick={ ( e: MouseEvent< HTMLButtonElement > ) => {
							e.stopPropagation();
							onToggle();
						} }
					/>
				) }
			</div>
		</OriginalCardHeader>
	);
};

/* ---------- Helper Functions ---------- */

function isSummaryFieldVisible< Item >(
	summaryField: NormalizedField< Item >,
	summaryConfig: NormalizedCardLayout[ 'summary' ],
	isOpen: boolean
) {
	if (
		! summaryConfig ||
		( Array.isArray( summaryConfig ) && summaryConfig.length === 0 )
	) {
		return false;
	}

	const summaryConfigArray = Array.isArray( summaryConfig )
		? summaryConfig
		: [ summaryConfig ];

	const fieldConfig = summaryConfigArray.find( ( config ) => {
		if ( typeof config === 'string' ) {
			return config === summaryField.id;
		}
		if ( typeof config === 'object' && 'id' in config ) {
			return config.id === summaryField.id;
		}
		return false;
	} );

	if ( ! fieldConfig ) {
		return false;
	}

	if ( typeof fieldConfig === 'string' ) {
		return true;
	}

	if ( typeof fieldConfig === 'object' && 'visibility' in fieldConfig ) {
		return (
			fieldConfig.visibility === 'always' ||
			( fieldConfig.visibility === 'when-collapsed' && ! isOpen )
		);
	}

	return true;
}

/* ---------- Main Component ---------- */

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

	// State management moved INTO the component (not in a hook)
	const { isOpened, isCollapsible } = layout;
	const [ isOpen, setIsOpen ] = useState( !! isOpened );

	useEffect( () => {
		setIsOpen( !! isOpened );
	}, [ isOpened ] );

	const toggle = useCallback( () => {
		if ( isCollapsible ) {
			setIsOpen( ( prev ) => ! prev );
		}
	}, [ isCollapsible ] );

	// CRITICAL: When not collapsible, always show content
	const effectiveIsOpen = isCollapsible ? isOpen : true;

	const summaryFields = getSummaryFields< Item >( layout.summary, fields );
	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, effectiveIsOpen )
	);

	const panelId = useMemo(
		() => `df-card-panel-${ String( field.id ) }`,
		[ field.id ]
	);

	// Card spacing sizes (from the fix/card-layout-focus branch)
	const sizeCard = {
		blockStart: 'medium' as const,
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	if ( !! field.children ) {
		const withHeader = !! field.label && layout.withHeader;

		const sizeCardBody = {
			blockStart: withHeader
				? ( 'none' as const )
				: ( 'medium' as const ),
			blockEnd: 'medium' as const,
			inlineStart: 'medium' as const,
			inlineEnd: 'medium' as const,
		};

		return (
			<Card className="dataforms-layouts-card__field" size={ sizeCard }>
				{ withHeader && (
					<CardHeader
						className="dataforms-layouts-card__field-header"
						isCollapsible={ isCollapsible }
						isOpen={ effectiveIsOpen }
						onToggle={ toggle }
						controlsId={ panelId }
					>
						<span className="dataforms-layouts-card__field-header-label">
							{ field.label }
						</span>
						{ visibleSummaryFields.length > 0 && (
							<div className="dataforms-layouts-card__field-summary">
								{ visibleSummaryFields.map( ( s ) => (
									<s.render
										key={ s.id }
										item={ data }
										field={ s }
									/>
								) ) }
							</div>
						) }
					</CardHeader>
				) }
				{ ( effectiveIsOpen || ! withHeader ) && (
					<CardBody
						id={ panelId }
						className="dataforms-layouts-card__field-control"
						size={ sizeCardBody }
					>
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

	const sizeCardBody = {
		blockStart: withHeader ? ( 'none' as const ) : ( 'medium' as const ),
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	return (
		<Card className="dataforms-layouts-card__field" size={ sizeCard }>
			{ withHeader && (
				<CardHeader
					className="dataforms-layouts-card__field-header"
					isCollapsible={ isCollapsible }
					isOpen={ effectiveIsOpen }
					onToggle={ toggle }
					controlsId={ panelId }
				>
					<span className="dataforms-layouts-card__field-header-label">
						{ fieldDefinition.label }
					</span>
					{ visibleSummaryFields.length > 0 && (
						<div className="dataforms-layouts-card__field-summary">
							{ visibleSummaryFields.map( ( s ) => (
								<s.render
									key={ s.id }
									item={ data }
									field={ s }
								/>
							) ) }
						</div>
					) }
				</CardHeader>
			) }
			{ ( effectiveIsOpen || ! withHeader ) && (
				<CardBody
					id={ panelId }
					className="dataforms-layouts-card__field-control"
					size={ sizeCardBody }
				>
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
