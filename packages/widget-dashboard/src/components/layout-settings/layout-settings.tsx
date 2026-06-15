/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Drawer } from '@wordpress/ui'; // eslint-disable-line @wordpress/use-recommended-components

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { migrateLayout } from '../../utils/migrate-layout';
import {
	presetToRowHeight,
	rowHeightToPreset,
	type RowHeightPreset,
} from '../../utils/row-height-presets';
import {
	WIDGET_DASHBOARD_COLUMN_COUNT,
	type WidgetGridLayoutSettings,
	type WidgetGridModel,
	type WidgetGridSettings,
} from '../../types';
import { LayoutModelEditField } from './layout-model-edit-field';

function getModel( item: WidgetGridSettings ): WidgetGridModel {
	return item.model ?? 'grid';
}

function isMasonry( item: WidgetGridSettings ): boolean {
	return getModel( item ) === 'masonry';
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
	fields: [ 'model', 'rowHeight' ],
};

/**
 * Modal side drawer for grid-level settings (model, row height).
 * Reads from and writes to the staging copy in
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
 * The engine mounts it; it shows while `layoutSettingsOpen` is `true`
 * in the shared UI context, which any trigger can set (today, the
 * Layout settings button in `Actions`). Renders nothing when grid
 * settings are not editable. Cancel and dismiss revert only grid
 * settings so in-progress widget layout edits in the same customize
 * session are preserved.
 *
 * @return {React.ReactNode} The layout settings drawer.
 */
export function LayoutSettings(): React.ReactNode {
	const {
		gridSettings,
		onGridSettingsChange,
		layout,
		onLayoutChange,
		commit,
		cancel: cancelStaging,
		resetGridSettings,
		hasUncommittedChanges,
		canEditGridSettings,
		editMode,
	} = useDashboardInternalContext();

	const { layoutSettingsOpen: open, setLayoutSettingsOpen: onOpenChange } =
		useDashboardUIContext();

	// Close when customize mode exits, whatever the exit path.
	useEffect( () => {
		if ( ! editMode && open ) {
			onOpenChange( false );
		}
	}, [ editMode, open, onOpenChange ] );

	const handleChange = useCallback(
		( edits: Record< string, unknown > ) => {
			const nextModel = edits.model as WidgetGridModel | undefined;
			const currentModel = getModel( gridSettings );

			if ( nextModel && nextModel !== currentModel ) {
				const migrated = migrateLayout(
					layout,
					currentModel,
					nextModel,
					{ columns: WIDGET_DASHBOARD_COLUMN_COUNT }
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

	if ( ! canEditGridSettings ) {
		return null;
	}

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
