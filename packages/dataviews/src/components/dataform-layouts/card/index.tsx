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
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

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

function CardHeader( {
	label,
	isOpen,
	isCollapsible,
	onToggle,
	children,
}: {
	label?: string;
	isOpen: boolean;
	isCollapsible: boolean;
	onToggle: () => void;
	children?: React.ReactNode;
} ) {
	return (
		<OriginalCardHeader
			isBorderless
			onClick={ isCollapsible ? onToggle : undefined }
			style={ isCollapsible ? { cursor: 'pointer' } : undefined }
		>
			<div
				style={ {
					height: '40px',
					width: '100%',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				} }
			>
				{ label && (
					<span className="dataforms-layouts-card__field-header-label">
						{ label }
					</span>
				) }
				{ children }

				{ isCollapsible && (
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						icon={ isOpen ? chevronUp : chevronDown }
						aria-expanded={ isOpen }
						aria-label={
							isOpen ? __( 'Collapse' ) : __( 'Expand' )
						}
					/>
				) }
			</div>
		</OriginalCardHeader>
	);
}

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

	const [ isOpen, setIsOpen ] = useState(
		layout.isCollapsible ? layout.isOpened : true
	);

	const [ touched, setTouched ] = useState( false );

	useEffect( () => {
		if ( layout.isCollapsible ) {
			setIsOpen( layout.isOpened );
		} else {
			setIsOpen( true );
		}
	}, [ layout.isOpened, layout.isCollapsible ] );

	const toggle = useCallback( () => {
		setIsOpen( ( prev ) => {
			if ( prev ) {
				setTouched( true );
			}
			return ! prev;
		} );
	}, [] );

	const form: NormalizedForm = useMemo(
		() => ( {
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		} ),
		[ field ]
	);

	const handleBlur = useCallback( () => {
		setTouched( true );
	}, [] );

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

	if ( field.children ) {
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
						label={ field.label }
						isOpen={ isOpen }
						isCollapsible={ !! layout.isCollapsible }
						onToggle={ toggle }
					>
						{ validationBadge }

						{ visibleSummaryFields.length > 0 && (
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
					<CardBody
						size={ sizeCardBody }
						className="dataforms-layouts-card__field-control"
						ref={ cardBodyRef }
						onBlur={ handleBlur }
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
					label={ fieldDefinition.label }
					isOpen={ isOpen }
					isCollapsible={ !! layout.isCollapsible }
					onToggle={ toggle }
				>
					{ validationBadge }

					{ visibleSummaryFields.length > 0 && (
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
				<CardBody
					size={ sizeCardBody }
					className="dataforms-layouts-card__field-control"
					ref={ cardBodyRef }
					onBlur={ handleBlur }
				>
					<RegularLayout
						data={ data }
						field={ field }
						onChange={ onChange }
						hideLabelFromVision={
							hideLabelFromVision || withHeader
						}
						markWhenOptional={ markWhenOptional }
						validity={ validity }
					/>
				</CardBody>
			) }
		</Card>
	);
}
