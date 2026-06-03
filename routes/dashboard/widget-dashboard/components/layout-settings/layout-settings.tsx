/**
 * WordPress dependencies
 */
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { DataFormControlProps, Field, Form } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Drawer } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { migrateLayout } from '../../utils/migrate-layout';
import {
	presetToRowHeight,
	rowHeightToPreset,
	type RowHeightPreset,
} from '../../utils/row-height-presets';
import type {
	WidgetGridLayoutSettings,
	WidgetGridModel,
	WidgetGridSettings,
} from '../../types';
import { LayoutModelEditField } from './layout-model-edit-field';

const DEFAULT_FIXED_COLUMNS = 6;
const DEFAULT_MIN_COLUMN_WIDTH = 350;

function getModel( item: WidgetGridSettings ): WidgetGridModel {
	return item.model ?? 'grid';
}

function isMasonry( item: WidgetGridSettings ): boolean {
	return getModel( item ) === 'masonry';
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
		Edit: LayoutModelEditField,
		label: __( 'Layout model' ),
		description: __(
			'Grid keeps every tile the same height. Masonry lets tiles flow at their own height.'
		),
		elements: [
			{ value: 'grid', label: __( 'Standard grid' ) },
			{ value: 'masonry', label: __( 'Masonry' ) },
		],
		getValue: ( { item } ) => getModel( item ),
	},
	{
		id: 'columns',
		type: 'integer',
		Edit: StepperIntegerEdit,
		label: __( 'Columns' ),
		description: __(
			'How many columns to show when the dashboard has enough space.'
		),
		isValid: { min: 1, max: 12 },
	},
	{
		id: 'adaptiveColumns',
		type: 'boolean',
		Edit: 'toggle',
		label: __( 'Adjust on narrow screens' ),
		description: __(
			'Show fewer columns when the dashboard gets too narrow to keep tiles readable.'
		),
		getValue: ( { item } ) => item.minColumnWidth !== 0,
		setValue: ( { item, value } ) => {
			if ( ! value ) {
				return { minColumnWidth: 0 };
			}
			const previous = item.minColumnWidth;
			return {
				minColumnWidth:
					previous && previous > 0
						? previous
						: DEFAULT_MIN_COLUMN_WIDTH,
			};
		},
	},
	{
		id: 'minColumnWidth',
		type: 'integer',
		Edit: StepperIntegerEdit,
		label: __( 'Minimum tile width' ),
		description: __(
			'The smallest tile width before a column is removed.'
		),
		isValid: { min: 48, max: 600 },
		isVisible: ( item ) => item.minColumnWidth !== 0,
	},
	{
		id: 'rowHeight',
		type: 'text',
		Edit: 'toggleGroup',
		label: __( 'Row height' ),
		description: __( 'Height of each grid row.' ),
		elements: [
			{ value: 'small', label: __( 'Small' ) },
			{ value: 'medium', label: __( 'Medium' ) },
			{ value: 'large', label: __( 'Large' ) },
		],
		getValue: ( { item } ) => {
			const rowHeight = ( item as WidgetGridLayoutSettings ).rowHeight;
			if ( typeof rowHeight !== 'number' ) {
				return 'medium';
			}
			return rowHeightToPreset( rowHeight );
		},
		setValue: ( { value } ) => ( {
			rowHeight: presetToRowHeight( value as RowHeightPreset ),
		} ),
		isVisible: ( item ) => ! isMasonry( item ),
	},
];

const form: Form = {
	layout: { type: 'regular', labelPosition: 'top' },
	fields: [
		'model',
		'columns',
		'adaptiveColumns',
		'minColumnWidth',
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
 * Modal side drawer for grid-level settings (model, column behavior,
 * row height). Reads from and writes to the staging copy in
 * `useDashboardInternalContext`; edits preview through the backdrop
 * and are committed or rolled back by the drawer's Save / Cancel
 * buttons.
 *
 * Gap is intentionally absent: the spacing between tiles is a
 * design-system concern (theme / density / viewport tokens) and
 * should not be configurable per dashboard.
 *
 * Save commits the staging buffer; Cancel reverts it; Reset
 * restores the package's built-in defaults in staging (still
 * subject to Save/Cancel). Closing the drawer through the X icon,
 * an Escape press, or any path other than the explicit Cancel/Save
 * buttons is treated as Cancel. None of these exit customize mode.
 *
 * Opened from the customize toolbar beside Add widget. Cancel and
 * dismiss revert only grid settings so in-progress widget layout
 * edits in the same customize session are preserved.
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
		cancelStaging( { exitEditMode: false, revertLayout: false } );
		onOpenChange( false );
	}, [ cancelStaging, onOpenChange ] );

	const handleSave = useCallback( () => {
		commit( { exitEditMode: false } );
		onOpenChange( false );
	}, [ commit, onOpenChange ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen && open ) {
				cancelStaging( { exitEditMode: false, revertLayout: false } );
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
