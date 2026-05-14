/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/* eslint-disable @wordpress/use-recommended-components */
import {
	Button,
	Drawer,
	InputControl,
	SelectControl,
	Stack,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { migrateLayout } from '../../utils/migrate-layout';
import type {
	WidgetGridModel,
	WidgetGridSettings,
	WidgetMasonryLayoutSettings,
} from '../../types';

const MODEL_ITEMS = [
	{ value: 'grid', label: __( 'Standard grid' ) },
	{ value: 'masonry', label: __( 'Masonry' ) },
] as const satisfies ReadonlyArray< { value: WidgetGridModel; label: string } >;

const ROW_HEIGHT_AUTO = 'auto' as const;

function getModelValue( settings: WidgetGridSettings ): WidgetGridModel {
	return settings.model ?? 'grid';
}

function parsePositiveInt( raw: unknown ): number | undefined {
	if ( typeof raw !== 'string' && typeof raw !== 'number' ) {
		return undefined;
	}
	const parsed = typeof raw === 'number' ? raw : Number.parseInt( raw, 10 );
	if ( ! Number.isFinite( parsed ) || parsed <= 0 ) {
		return undefined;
	}
	return parsed;
}

interface LayoutSettingsProps {
	open: boolean;
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
 * @param props
 * @param props.open         Whether the drawer is visible.
 * @param props.onOpenChange Toggle controller from the trigger.
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

	const currentModel = getModelValue( gridSettings );
	const isMasonry = currentModel === 'masonry';

	const handleModelChange = useCallback(
		( nextModel: WidgetGridModel ) => {
			if ( nextModel === currentModel ) {
				return;
			}

			const migrated = migrateLayout( layout, currentModel, nextModel, {
				columns: gridSettings.columns ?? 6,
			} );

			onLayoutChange( migrated );
			onGridSettingsChange( {
				...gridSettings,
				model: nextModel,
			} as WidgetGridSettings );
		},
		[
			currentModel,
			gridSettings,
			layout,
			onGridSettingsChange,
			onLayoutChange,
		]
	);

	const handleMinColumnWidthChange = useCallback(
		( raw: unknown ) => {
			const next = parsePositiveInt( raw );
			onGridSettingsChange( {
				...gridSettings,
				minColumnWidth: next,
			} as WidgetGridSettings );
		},
		[ gridSettings, onGridSettingsChange ]
	);

	const handleColumnsChange = useCallback(
		( raw: unknown ) => {
			const next = parsePositiveInt( raw );
			onGridSettingsChange( {
				...gridSettings,
				columns: next,
			} as WidgetGridSettings );
		},
		[ gridSettings, onGridSettingsChange ]
	);

	const handleColumnsModeChange = useCallback(
		( useFixedColumns: boolean ) => {
			if ( useFixedColumns ) {
				onGridSettingsChange( {
					...gridSettings,
					columns: gridSettings.columns ?? 6,
					minColumnWidth: undefined,
				} as WidgetGridSettings );
			} else {
				onGridSettingsChange( {
					...gridSettings,
					columns: undefined,
					minColumnWidth: gridSettings.minColumnWidth ?? 350,
				} as WidgetGridSettings );
			}
		},
		[ gridSettings, onGridSettingsChange ]
	);

	const setRowHeight = useCallback(
		( raw: unknown ) => {
			const next = parsePositiveInt( raw );
			onGridSettingsChange( {
				...gridSettings,
				rowHeight: next,
			} as WidgetGridSettings );
		},
		[ gridSettings, onGridSettingsChange ]
	);

	const setRowHeightAuto = useCallback(
		( checked: boolean ) => {
			onGridSettingsChange( {
				...gridSettings,
				rowHeight: checked ? ROW_HEIGHT_AUTO : 200,
			} as WidgetGridSettings );
		},
		[ gridSettings, onGridSettingsChange ]
	);

	const rowHeight = isMasonry
		? undefined
		: (
				gridSettings as Exclude<
					WidgetGridSettings,
					WidgetMasonryLayoutSettings
				>
		   ).rowHeight;
	const isRowHeightAuto = rowHeight === ROW_HEIGHT_AUTO;
	const isFixedColumns = gridSettings.columns !== undefined;

	const modelItem = MODEL_ITEMS.find(
		( item ) => item.value === currentModel
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
					<Stack direction="column" gap="lg">
						<SelectControl
							label={ __( 'Layout model' ) }
							description={ __(
								'Standard grid uses explicit widths and heights. Masonry packs items by content height.'
							) }
							items={ [ ...MODEL_ITEMS ] }
							value={ modelItem }
							onValueChange={ ( item ) => {
								if ( item ) {
									handleModelChange(
										item.value as WidgetGridModel
									);
								}
							} }
						/>

						<Stack direction="column" gap="xs">
							<ToggleControl
								label={ __( 'Fixed column count' ) }
								checked={ isFixedColumns }
								onChange={ handleColumnsModeChange }
							/>
							{ isFixedColumns ? (
								<InputControl
									label={ __( 'Columns' ) }
									type="number"
									min={ 1 }
									max={ 12 }
									value={ gridSettings.columns ?? '' }
									onValueChange={ handleColumnsChange }
								/>
							) : (
								<InputControl
									label={ __( 'Min column width (px)' ) }
									description={ __(
										'Minimum width of each column. The number of columns adapts to the container width.'
									) }
									type="number"
									min={ 200 }
									step={ 10 }
									value={ gridSettings.minColumnWidth ?? '' }
									onValueChange={ handleMinColumnWidthChange }
								/>
							) }
						</Stack>

						<Stack direction="column" gap="xs">
							<ToggleControl
								label={ __( 'Auto-fit row height to content' ) }
								checked={ isRowHeightAuto }
								disabled={ isMasonry }
								onChange={ setRowHeightAuto }
							/>
							<InputControl
								label={ __( 'Row height (px)' ) }
								description={
									isMasonry
										? __(
												'Row height is content-driven in masonry layouts.'
										  )
										: __(
												'Height of each row in the standard grid.'
										  )
								}
								type="number"
								min={ 100 }
								step={ 10 }
								disabled={ isMasonry || isRowHeightAuto }
								value={
									typeof rowHeight === 'number'
										? rowHeight
										: ''
								}
								onValueChange={ setRowHeight }
							/>
						</Stack>
					</Stack>
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
