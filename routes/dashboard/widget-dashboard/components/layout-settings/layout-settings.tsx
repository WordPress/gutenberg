/**
 * WordPress dependencies
 */
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { DataFormControlProps, Field, Form } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/* eslint-disable @wordpress/use-recommended-components */
import { Button, Drawer } from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { migrateLayout } from '../../utils/migrate-layout';
import type {
	WidgetGridLayoutSettings,
	WidgetGridModel,
	WidgetGridSettings,
} from '../../types';

const DEFAULT_FIXED_COLUMNS = 6;
const DEFAULT_MIN_COLUMN_WIDTH = 350;
const DEFAULT_ROW_HEIGHT = 200;
const ROW_HEIGHT_AUTO = 'auto' as const;

function getModel( item: WidgetGridSettings ): WidgetGridModel {
	return item.model ?? 'grid';
}

function isMasonry( item: WidgetGridSettings ): boolean {
	return getModel( item ) === 'masonry';
}

function isFixedColumns( item: WidgetGridSettings ): boolean {
	return item.columns !== undefined;
}

function getRowHeight(
	item: WidgetGridSettings
): WidgetGridLayoutSettings[ 'rowHeight' ] {
	if ( isMasonry( item ) ) {
		return undefined;
	}
	return ( item as WidgetGridLayoutSettings ).rowHeight;
}

function isAutoRowHeight( item: WidgetGridSettings ): boolean {
	return getRowHeight( item ) === ROW_HEIGHT_AUTO;
}

function StepperIntegerEdit( {
	data,
	field,
	onChange,
}: DataFormControlProps< WidgetGridSettings > ) {
	const { label, description, getValue, setValue, isValid } = field;
	const value = getValue( { item: data } );
	const disabled = field.isDisabled( { item: data, field } );
	const min =
		typeof isValid.min?.constraint === 'number'
			? isValid.min.constraint
			: undefined;
	const max =
		typeof isValid.max?.constraint === 'number'
			? isValid.max.constraint
			: undefined;

	return (
		<NumberControl
			__next40pxDefaultSize
			label={ label }
			help={ description }
			value={ value ?? '' }
			min={ min }
			max={ max }
			step={ 1 }
			spinControls="custom"
			disabled={ disabled }
			onChange={ ( next ) => {
				const parsed =
					next === '' || next === undefined
						? undefined
						: Number( next );
				onChange( setValue( { item: data, value: parsed } ) );
			} }
		/>
	);
}

const fields: Field< WidgetGridSettings >[] = [
	{
		id: 'model',
		type: 'text',
		Edit: 'select',
		label: __( 'Layout model' ),
		description: __(
			'Standard grid uses explicit widths and heights. Masonry packs items by content height.'
		),
		elements: [
			{ value: 'grid', label: __( 'Standard grid' ) },
			{ value: 'masonry', label: __( 'Masonry' ) },
		],
		getValue: ( { item } ) => getModel( item ),
	},
	{
		id: 'fixedColumns',
		type: 'boolean',
		Edit: 'toggle',
		label: __( 'Fixed column count' ),
		getValue: ( { item } ) => isFixedColumns( item ),
		setValue: ( { item, value } ) =>
			value
				? {
						columns: item.columns ?? DEFAULT_FIXED_COLUMNS,
						minColumnWidth: undefined,
				  }
				: {
						columns: undefined,
						minColumnWidth:
							item.minColumnWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
				  },
	},
	{
		id: 'columns',
		type: 'integer',
		Edit: StepperIntegerEdit,
		label: __( 'Columns' ),
		isValid: { min: 1, max: 12 },
		isVisible: ( item ) => isFixedColumns( item ),
	},
	{
		id: 'minColumnWidth',
		type: 'integer',
		Edit: StepperIntegerEdit,
		label: __( 'Min column width (px)' ),
		description: __(
			'Minimum width of each column. The number of columns adapts to the container width.'
		),
		isValid: { min: 48, max: 1024 },
		isVisible: ( item ) => ! isFixedColumns( item ),
	},
	{
		id: 'autoRowHeight',
		type: 'boolean',
		Edit: 'toggle',
		label: __( 'Auto-fit row height to content' ),
		getValue: ( { item } ) => isAutoRowHeight( item ),
		setValue: ( { value } ) => ( {
			rowHeight: value ? ROW_HEIGHT_AUTO : DEFAULT_ROW_HEIGHT,
		} ),
		isDisabled: ( { item } ) => isMasonry( item ),
	},
	{
		id: 'rowHeight',
		type: 'integer',
		Edit: StepperIntegerEdit,
		label: __( 'Row height (px)' ),
		description: __( 'Height of each row in the standard grid.' ),
		isValid: { min: 100 },
		getValue: ( { item } ) => {
			const rh = getRowHeight( item );
			return typeof rh === 'number' ? rh : undefined;
		},
		isVisible: ( item ) => ! isMasonry( item ),
		isDisabled: ( { item } ) => isAutoRowHeight( item ),
	},
];

const form: Form = {
	layout: { type: 'regular', labelPosition: 'top' },
	fields: [
		'model',
		'fixedColumns',
		'columns',
		'minColumnWidth',
		'autoRowHeight',
		'rowHeight',
	],
};

interface LayoutSettingsProps {
	/**
	 * Whether the drawer is visible.
	 */
	open: boolean;

	/**
	 * Callback to toggle the drawer.
	 */
	onOpenChange: ( open: boolean ) => void;
}

/**
 * Non-modal side drawer for grid-level settings (model, column
 * behavior, row height). Reads from and writes to the staging copy
 * in `useDashboardInternalContext`, so every edit shows up live
 * behind the drawer and is committed or rolled back by the drawer's
 * Save / Cancel buttons.
 *
 * Gap is intentionally absent: the spacing between tiles is a
 * design-system concern (theme / density / viewport tokens) and
 * should not be configurable per dashboard.
 *
 * Save commits the staging buffer; Cancel reverts it; Reset
 * restores the package's built-in defaults in staging (still
 * subject to Save/Cancel). Closing the drawer through the X icon,
 * an Escape press, or any path other than the explicit Cancel/Save
 * buttons is treated as Cancel.
 *
 * Settings and layout-editing are kept as separate flows on the
 * dashboard surface (the Layout settings entry that opens this
 * drawer is disabled while edit mode is on), so the drawer's
 * commit never publishes layout edits that the user is in the
 * middle of staging through the toolbar.
 *
 * @param {LayoutSettingsProps} props Layout settings props.
 * @return {React.ReactNode} The layout settings component.
 */
export function LayoutSettings( {
	open,
	onOpenChange,
}: LayoutSettingsProps ): React.ReactNode {
	const {
		gridSettings,
		onGridSettingsChange,
		layout,
		onLayoutChange,
		commit,
		cancel: cancelStaging,
		resetGridSettings,
		hasUncommittedChanges,
	} = useDashboardInternalContext();

	const handleChange = useCallback(
		( edits: Record< string, unknown > ) => {
			const nextModel = edits.model as WidgetGridModel | undefined;
			const currentModel = getModel( gridSettings );

			if ( nextModel && nextModel !== currentModel ) {
				const migrated = migrateLayout(
					layout,
					currentModel,
					nextModel,
					{ columns: gridSettings.columns ?? DEFAULT_FIXED_COLUMNS }
				);
				onLayoutChange( migrated );
			}

			onGridSettingsChange( {
				...gridSettings,
				...edits,
			} as WidgetGridSettings );
		},
		[ gridSettings, layout, onGridSettingsChange, onLayoutChange ]
	);

	const handleCancel = useCallback( () => {
		cancelStaging();
		onOpenChange( false );
	}, [ cancelStaging, onOpenChange ] );

	const handleSave = useCallback( () => {
		commit();
		onOpenChange( false );
	}, [ commit, onOpenChange ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen && open ) {
				cancelStaging();
			}
			onOpenChange( nextOpen );
		},
		[ open, cancelStaging, onOpenChange ]
	);

	return (
		<Drawer.Root
			open={ open }
			onOpenChange={ handleOpenChange }
			swipeDirection="right"
			modal={ false }
			disablePointerDismissal
		>
			<Drawer.Popup size="medium" style={ { marginTop: '32px' } }>
				<Drawer.Header>
					<Drawer.Title>{ __( 'Layout settings' ) }</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>

				<Drawer.Content>
					<DataForm
						data={ gridSettings }
						fields={ fields }
						form={ form }
						onChange={ handleChange }
					/>
				</Drawer.Content>

				<Drawer.Footer>
					<Button
						variant="minimal"
						tone="neutral"
						size="compact"
						onClick={ resetGridSettings }
						style={ { marginInlineEnd: 'auto' } }
					>
						{ __( 'Reset' ) }
					</Button>
					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ handleCancel }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="solid"
						tone="brand"
						size="compact"
						onClick={ handleSave }
						disabled={ ! hasUncommittedChanges }
					>
						{ __( 'Save' ) }
					</Button>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}
