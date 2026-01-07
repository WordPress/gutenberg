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
	useState,
	useRef,
} from '@wordpress/element';
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

const NonCollapsibleCardHeader = ({
	children,
	...props
}: {
	children: React.ReactNode;
}) => (
	<OriginalCardHeader isBorderless {...props}>
		<div
			style={{
				height: '40px',
				width: '100%',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			{children}
		</div>
	</OriginalCardHeader>
);

export function useCardHeader(layout: NormalizedCardLayout) {
	const { isOpened, isCollapsible } = layout;
	const [isOpen, setIsOpen] = useState(isOpened);
	const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

	// Sync internal state when the isOpened prop changes.
	useEffect(() => {
		setIsOpen(isOpened);
	}, [isOpened]);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);

		requestAnimationFrame(() => {
			toggleButtonRef.current?.focus();
		});
	}, []);

	const CollapsibleCardHeader = useCallback(
		({
			children,
			...props
		}: {
			children: React.ReactNode;
			[key: string]: any;
		}) => (
			<OriginalCardHeader
				{...props}
				onClick={toggle}
				style={{
					cursor: 'pointer',
					...props.style,
				}}
				isBorderless
			>
				<div
					style={{
						width: '100%',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					{children}
				</div>
				<Button
					ref={toggleButtonRef}
					__next40pxDefaultSize
					variant="tertiary"
					icon={isOpen ? chevronUp : chevronDown}
					aria-expanded={isOpen}
					aria-label={isOpen ? 'Collapse' : 'Expand'}
				/>
			</OriginalCardHeader>
		),
		[toggle, isOpen]
	);

	const effectiveIsOpen = isCollapsible ? isOpen : true;
	const CardHeaderComponent = isCollapsible
		? CollapsibleCardHeader
		: NonCollapsibleCardHeader;

	return { isOpen: effectiveIsOpen, CardHeader: CardHeaderComponent };
}

function isSummaryFieldVisible<Item>(
	summaryField: NormalizedField<Item>,
	summaryConfig: NormalizedCardLayout['summary'],
	isOpen: boolean
) {
	if (
		!summaryConfig ||
		(Array.isArray(summaryConfig) && summaryConfig.length === 0)
	) {
		return false;
	}

	const summaryConfigArray = Array.isArray(summaryConfig)
		? summaryConfig
		: [summaryConfig];

	const fieldConfig = summaryConfigArray.find((config) => {
		if (typeof config === 'string') {
			return config === summaryField.id;
		}
		if (typeof config === 'object' && 'id' in config) {
			return config.id === summaryField.id;
		}
		return false;
	});

	if (!fieldConfig) {
		return false;
	}

	if (typeof fieldConfig === 'string') {
		return true;
	}

	if (typeof fieldConfig === 'object' && 'visibility' in fieldConfig) {
		return (
			fieldConfig.visibility === 'always' ||
			(fieldConfig.visibility === 'when-collapsed' && !isOpen)
		);
	}

	return true;
}

export default function FormCardField<Item>({
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: FieldLayoutProps<Item>) {
	const { fields } = useContext(DataFormContext);
	const layout = field.layout as NormalizedCardLayout;

	const form: NormalizedForm = useMemo(
		() => ({
			layout: DEFAULT_LAYOUT as NormalizedLayout,
			fields: field.children ?? [],
		}),
		[field]
	);

	const { isOpen, CardHeader } = useCardHeader(layout);

	const summaryFields = getSummaryFields<Item>(layout.summary, fields);

	const visibleSummaryFields = summaryFields.filter((summaryField) =>
		isSummaryFieldVisible(summaryField, layout.summary, isOpen)
	);

	const sizeCard = {
		blockStart: 'medium' as const,
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};

	if (!!field.children) {
		const withHeader = !!field.label && layout.withHeader;

		const sizeCardBody = {
			blockStart: withHeader ? ('none' as const) : ('medium' as const),
			blockEnd: 'medium' as const,
			inlineStart: 'medium' as const,
			inlineEnd: 'medium' as const,
		};


		return (
			<Card className="dataforms-layouts-card__field" size={sizeCard}>
				{withHeader && (
					<CardHeader className="dataforms-layouts-card__field-header">
						<span className="dataforms-layouts-card__field-header-label">
							{field.label}
						</span>
						{visibleSummaryFields.length > 0 &&
							layout.withHeader && (
								<div className="dataforms-layouts-card__field-summary">
									{visibleSummaryFields.map(
										(summaryField) => (
											<summaryField.render
												key={summaryField.id}
												item={data}
												field={summaryField}
											/>
										)
									)}
								</div>
							)}
					</CardHeader>
				)}
				{(isOpen || !withHeader) && (
					<CardBody
						size={sizeCardBody}
						className="dataforms-layouts-card__field-control"
					>
						{field.description && (
							<div className="dataforms-layouts-card__field-description">
								{field.description}
							</div>
						)}
						<DataFormLayout
							data={data}
							form={form}
							onChange={onChange}
							validity={validity?.children}
						/>
					</CardBody>
				)}
			</Card>
		);
	}

	const fieldDefinition = fields.find(
		(fieldDef) => fieldDef.id === field.id
	);

	if (!fieldDefinition || !fieldDefinition.Edit) {
		return null;
	}

	const RegularLayout = getFormFieldLayout('regular')?.component;
	if (!RegularLayout) {
		return null;
	}

	const withHeader = !!fieldDefinition.label && layout.withHeader;

	const sizeCardBody = {
		blockStart: withHeader ? ('none' as const) : ('medium' as const),
		blockEnd: 'medium' as const,
		inlineStart: 'medium' as const,
		inlineEnd: 'medium' as const,
	};


	return (
		<Card className="dataforms-layouts-card__field" size={sizeCard}>
			{withHeader && (
				<CardHeader className="dataforms-layouts-card__field-header">
					<span className="dataforms-layouts-card__field-header-label">
						{fieldDefinition.label}
					</span>
					{visibleSummaryFields.length > 0 && layout.withHeader && (
						<div className="dataforms-layouts-card__field-summary">
							{visibleSummaryFields.map((summaryField) => (
								<summaryField.render
									key={summaryField.id}
									item={data}
									field={summaryField}
								/>
							))}
						</div>
					)}
				</CardHeader>
			)}
			{(isOpen || !withHeader) && (
				<CardBody
					size={sizeCardBody}
					className="dataforms-layouts-card__field-control"
				>
					<RegularLayout
						data={data}
						field={field}
						onChange={onChange}
						hideLabelFromVision={hideLabelFromVision || withHeader}
						validity={validity}
					/>
				</CardBody>
			)}
		</Card>
	);
}