/**
 * External dependencies
 */
import type { ReactNode } from 'react';

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
	useEffect,
	useLayoutEffect,
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

/* ---------- Stable header components ---------- */

const NonCollapsibleCardHeader = ( {
	children,
	...props
}: {
	children: ReactNode;
	[ key: string ]: any;
} ) => (
	<OriginalCardHeader isBorderless { ...props }>
		<div
			style={ {
				height: '40px', // match the chevron's __next40pxDefaultSize
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

interface CollapsibleCardHeaderProps {
	children: ReactNode;
	controlsId?: string;
	isOpen: boolean;
	onToggle: () => void;
	btnRef: React.RefObject< HTMLButtonElement >;
	[ key: string ]: any;
}

const CollapsibleCardHeader = ( {
	children,
	controlsId,
	isOpen,
	onToggle,
	btnRef,
	...props
}: CollapsibleCardHeaderProps ) => (
	<OriginalCardHeader isBorderless { ...props }>
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
			ref={ btnRef }
			type="button"
			__next40pxDefaultSize
			variant="tertiary"
			icon={ isOpen ? chevronUp : chevronDown }
			aria-expanded={ isOpen }
			aria-controls={ controlsId }
			aria-label={ isOpen ? __( 'Collapse' ) : __( 'Expand' ) }
			onClick={ onToggle }
		/>
	</OriginalCardHeader>
);

/* ---------- State/refs hook (no components) ---------- */

export function useCardHeader( layout: NormalizedCardLayout ) {
	const { isOpened, isCollapsible } = layout;
	const [ isOpen, setIsOpen ] = useState( !! isOpened );
	const toggleButtonRef = useRef< HTMLButtonElement >( null );
	const shouldFocusRef = useRef( false );

	useEffect( () => {
		setIsOpen( !! isOpened );
	}, [ isOpened ] );

	const toggle = useCallback( () => {
		shouldFocusRef.current = true;
		setIsOpen( ( prev ) => ! prev );
	}, [] );

	// Focus before paint to avoid a flicker
	useLayoutEffect( () => {
		if ( shouldFocusRef.current && toggleButtonRef.current ) {
			toggleButtonRef.current.focus();
			shouldFocusRef.current = false;
		}
	}, [ isOpen ] );

	return {
		isOpen: isCollapsible ? isOpen : true,
		toggle,
		toggleButtonRef,
		isCollapsible,
	};
}

/* ---------- Helpers ---------- */

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

/* ---------- Main component ---------- */

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

	const { isOpen, toggle, toggleButtonRef, isCollapsible } =
		useCardHeader( layout );

	const summaryFields = getSummaryFields< Item >( layout.summary, fields );
	const visibleSummaryFields = summaryFields.filter( ( summaryField ) =>
		isSummaryFieldVisible( summaryField, layout.summary, isOpen )
	);

	const panelId = useMemo(
		() => `df-card-panel-${ String( field.id ) }`,
		[ field.id ]
	);

	if ( !! field.children ) {
		const withHeader = !! field.label && layout.withHeader;

		return (
			<Card className="dataforms-layouts-card__field">
				{ withHeader &&
					( isCollapsible ? (
						<CollapsibleCardHeader
							className="dataforms-layouts-card__field-header"
							controlsId={ panelId }
							isOpen={ isOpen }
							onToggle={ toggle }
							btnRef={ toggleButtonRef }
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
						</CollapsibleCardHeader>
					) : (
						<NonCollapsibleCardHeader className="dataforms-layouts-card__field-header">
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
						</NonCollapsibleCardHeader>
					) ) }
				{ ( isOpen || ! withHeader ) && (
					<CardBody
						id={ panelId }
						className="dataforms-layouts-card__field-control"
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

	return (
		<Card className="dataforms-layouts-card__field">
			{ withHeader &&
				( isCollapsible ? (
					<CollapsibleCardHeader
						className="dataforms-layouts-card__field-header"
						controlsId={ panelId }
						isOpen={ isOpen }
						onToggle={ toggle }
						btnRef={ toggleButtonRef }
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
					</CollapsibleCardHeader>
				) : (
					<NonCollapsibleCardHeader className="dataforms-layouts-card__field-header">
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
					</NonCollapsibleCardHeader>
				) ) }
			{ ( isOpen || ! withHeader ) && (
				<CardBody
					id={ panelId }
					className="dataforms-layouts-card__field-control"
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
