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
 * Modal side drawer for grid-level settings (layout model and row height),
 * mounted by the engine and shown while `layoutSettingsOpen` is set in the
 * shared UI context. Renders nothing when grid settings are not editable.
 *
 * Edits, including Reset, apply to the staging copy and preview live behind
 * the drawer. Save commits them; Cancel and any other dismissal (X, Escape)
 * revert them. Either way only grid settings change, so in-progress widget
 * layout edits survive and customize mode stays active.
 *
 * Tile gap is deliberately not exposed; spacing stays a design-system concern.
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
