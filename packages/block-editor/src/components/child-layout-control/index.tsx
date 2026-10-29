import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalInputControl as WCInputControl,
	__experimentalVStack as VStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useGetNumberOfBlocksBeforeCell } from '../grid/use-get-number-of-blocks-before-cell';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useSettings } from '../use-settings';
import { useUpdateGridChildLayout } from '../grid/use-update-grid-child-layout';
import { getGridItemBox } from '../grid/free-placement';
import { hasViewportBlockStyleState } from '../../hooks/block-style-state';
import type { GridItemAttributes } from '../grid/types';
import type {
	ChildLayout,
	ChildLayoutControlProps,
	ChildLayoutControlsProps,
	ParentLayout,
} from './types';

// These are the serialized `selfStretch` values. `max` used to be called
// "Fixed" in the UI, but was renamed and replaced by `fixedNoShrink`.
const FLEX_CHILD_LAYOUT_VALUES = {
	fit: 'fit',
	grow: 'fill',
	max: 'fixed',
	fixed: 'fixedNoShrink',
};

const FLEX_SIZE_VALUES = [
	FLEX_CHILD_LAYOUT_VALUES.max,
	FLEX_CHILD_LAYOUT_VALUES.fixed,
];

function isFlexSizeValue( value: string | undefined ) {
	// `includes` finds no match for `undefined`.
	return FLEX_SIZE_VALUES.includes( value as string );
}

function maxSizeLabel( parentLayout: ParentLayout | undefined ) {
	const { orientation = 'horizontal' } = parentLayout ?? {};
	return orientation === 'horizontal'
		? _x( 'Max', 'Block with maximum width in flex layout' )
		: _x( 'Max', 'Block with maximum height in flex layout' );
}

function helpText(
	flexControlValue: string,
	parentLayout: ParentLayout | undefined
) {
	const { orientation = 'horizontal' } = parentLayout ?? {};

	if ( flexControlValue === FLEX_CHILD_LAYOUT_VALUES.grow ) {
		return __( 'Stretch to fill available space.' );
	}
	if (
		flexControlValue === FLEX_CHILD_LAYOUT_VALUES.max &&
		orientation === 'horizontal'
	) {
		return __( 'Specify a maximum width.' );
	} else if ( flexControlValue === FLEX_CHILD_LAYOUT_VALUES.max ) {
		return __( 'Specify a maximum height.' );
	}
	if (
		flexControlValue === FLEX_CHILD_LAYOUT_VALUES.fixed &&
		orientation === 'horizontal'
	) {
		return __( 'Specify a fixed width.' );
	} else if ( flexControlValue === FLEX_CHILD_LAYOUT_VALUES.fixed ) {
		return __( 'Specify a fixed height.' );
	}
	return __( 'Fit contents.' );
}

/**
 * Form to edit the child layout value.
 *
 * @param props                      Props.
 * @param props.value                The child layout value.
 * @param props.onChange             Function to update the child layout value.
 * @param props.parentLayout         The parent layout value.
 *
 * @param props.isShownByDefault     Whether the control is shown by default.
 * @param props.panelId              The panel ID.
 * @param props.showGridSpanDefaults Whether unset grid span controls should show default values.
 * @return child layout edit element.
 */
export default function ChildLayoutControl( {
	value: childLayout = {},
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
	showGridSpanDefaults = true,
}: ChildLayoutControlProps ) {
	const {
		type: parentType,
		default: { type: defaultParentType = 'default' } = {},
	} = parentLayout ?? {};
	const parentLayoutType = parentType || defaultParentType;

	if ( parentLayoutType === 'flex' ) {
		return (
			<FlexControls
				childLayout={ childLayout }
				onChange={ onChange }
				parentLayout={ parentLayout }
				isShownByDefault={ isShownByDefault }
				panelId={ panelId }
			/>
		);
	} else if ( parentLayoutType === 'grid' ) {
		return (
			<GridControls
				childLayout={ childLayout }
				onChange={ onChange }
				parentLayout={ parentLayout }
				isShownByDefault={ isShownByDefault }
				panelId={ panelId }
				showGridSpanDefaults={ showGridSpanDefaults }
			/>
		);
	}

	return null;
}

function FlexControls( {
	childLayout,
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
}: ChildLayoutControlsProps ) {
	const { selfStretch, flexSize } = childLayout;
	const { orientation = 'horizontal' } = parentLayout ?? {};
	const flexControlValue = selfStretch || FLEX_CHILD_LAYOUT_VALUES.fit;
	const hasFlexSizeValue = isFlexSizeValue( flexControlValue );
	const hasFlexValue = () => !! selfStretch;
	const flexResetLabel =
		orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		// The setting lists unit names.
		availableUnits: ( availableUnits as string[] | undefined ) || [
			'%',
			'px',
			'em',
			'rem',
			'vh',
			'vw',
		],
	} );
	const resetFlex = () => {
		onChange( {
			selfStretch: undefined,
			flexSize: undefined,
		} );
	};

	useEffect( () => {
		if ( isFlexSizeValue( selfStretch ) && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: FLEX_CHILD_LAYOUT_VALUES.fit,
			} );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<VStack
			as={ ToolsPanelItem }
			spacing={ 2 }
			hasValue={ hasFlexValue }
			label={ flexResetLabel }
			onDeselect={ resetFlex }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<ToggleGroupControl
				label={ childLayoutOrientation( parentLayout ) }
				value={ flexControlValue }
				help={ helpText( flexControlValue, parentLayout ) }
				onChange={ ( value ) => {
					// The options have string values.
					const newFlexSize = isFlexSizeValue( value as string )
						? flexSize
						: null;
					onChange( {
						selfStretch: value as string,
						flexSize: newFlexSize,
					} );
				} }
				isBlock
			>
				<ToggleGroupControlOption
					key={ FLEX_CHILD_LAYOUT_VALUES.fit }
					value={ FLEX_CHILD_LAYOUT_VALUES.fit }
					label={ _x(
						'Fit',
						'Intrinsic block width in flex layout'
					) }
				/>
				<ToggleGroupControlOption
					key={ FLEX_CHILD_LAYOUT_VALUES.grow }
					value={ FLEX_CHILD_LAYOUT_VALUES.grow }
					label={ _x(
						'Grow',
						'Block with expanding width in flex layout'
					) }
				/>
				<ToggleGroupControlOption
					key={ FLEX_CHILD_LAYOUT_VALUES.max }
					value={ FLEX_CHILD_LAYOUT_VALUES.max }
					label={ maxSizeLabel( parentLayout ) }
				/>
				<ToggleGroupControlOption
					key={ FLEX_CHILD_LAYOUT_VALUES.fixed }
					value={ FLEX_CHILD_LAYOUT_VALUES.fixed }
					label={ _x(
						'Fixed',
						'Block with fixed width in flex layout'
					) }
				/>
			</ToggleGroupControl>
			{ hasFlexSizeValue && (
				<UnitControl
					units={ units }
					onChange={ ( value ) => {
						onChange( {
							selfStretch: flexControlValue,
							flexSize: value,
						} );
					} }
					// The control shows no value for `null`.
					value={ flexSize as string | undefined }
					min={ 0 }
					label={ flexResetLabel }
					hideLabelFromVision
				/>
			) }
		</VStack>
	);
}

export function childLayoutOrientation(
	parentLayout: ParentLayout | undefined
) {
	const { orientation = 'horizontal' } = parentLayout ?? {};
	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}

function GridControls( {
	childLayout,
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
	showGridSpanDefaults,
}: ChildLayoutControlsProps ) {
	const rootClientId = useSelect( ( select ) =>
		select( blockEditorStore ).getBlockRootClientId( panelId )
	);
	// On mobile, a stacked grid shows every block full width, one after
	// another, so the controls show the block's place in the stack. The grid
	// needs its own mobile layout before an edit to one of its blocks can have
	// an effect, so edits go through the grid updater, which creates it from
	// the stack.
	const stackedLayouts = useSelect(
		( select ) =>
			// A block without a parent isn't in a grid, and grids only stack
			// with the grid interactivity experiment.
			rootClientId && window.__experimentalEnableGridInteractivity
				? unlock( select( blockEditorStore ) ).getStackedGridLayouts(
						rootClientId
					)
				: null,
		[ rootClientId ]
	);
	// In a viewport state, the control shows that viewport's own layout. A
	// block placed freely keeps the box of the place it has there, which can
	// be its default place.
	const defaultPlaceBox = useSelect(
		( select ) => {
			const { getBlockAttributes, getSelectedBlockStyleState } =
				select( blockEditorStore );
			if (
				// The viewport is the same for every block.
				! hasViewportBlockStyleState(
					getSelectedBlockStyleState( panelId )
				)
			) {
				return undefined;
			}
			return getGridItemBox(
				// The block's style attribute is an object when set.
				( getBlockAttributes( panelId ) as GridItemAttributes | null )
					?.style?.layout,
				childLayout
			);
		},
		[ panelId, childLayout ]
	);
	const isStackedOnMobile = !! stackedLayouts;
	// A block placed freely in a manual grid has a box inside its cells.
	// Moving it by whole cells keeps its box, so it keeps its shape, while
	// typing a span snaps it to the cells, so its box goes.
	const {
		columnStart,
		rowStart,
		columnSpan,
		rowSpan,
		box = defaultPlaceBox,
	} = stackedLayouts?.children[ panelId ] ?? childLayout;
	const { columnCount, rowCount } = {
		...parentLayout,
		...stackedLayouts?.grid,
	};
	const updateGridChildLayout = useUpdateGridChildLayout();
	const onChangeLayout = isStackedOnMobile
		? ( changes: ChildLayout ) => updateGridChildLayout( panelId, changes )
		: onChange;
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		rootClientId,
		columnCount || 3
	);
	const hasStartValue = () => !! columnStart || !! rowStart;
	const hasSpanValue = () => !! columnSpan || !! rowSpan;
	const resetGridStarts = () => {
		onChangeLayout( {
			columnStart: undefined,
			rowStart: undefined,
			box: undefined,
		} );
	};
	const resetGridSpans = () => {
		onChangeLayout( {
			columnSpan: undefined,
			rowSpan: undefined,
			box: undefined,
		} );
	};

	// Calculate max column span based on current position and grid width
	const maxColumnSpan = columnCount
		? columnCount - ( columnStart ?? 1 ) + 1
		: undefined;

	// Calculate max row span based on current position and grid height
	const maxRowSpan =
		window.__experimentalEnableGridInteractivity && rowCount
			? rowCount - ( rowStart ?? 1 ) + 1
			: undefined;
	const columnSpanValue =
		columnSpan ?? ( showGridSpanDefaults ? 1 : undefined );
	const rowSpanValue = rowSpan ?? ( showGridSpanDefaults ? 1 : undefined );

	return (
		<>
			<Flex
				as={ ToolsPanelItem }
				hasValue={ hasSpanValue }
				label={ __( 'Grid span' ) }
				onDeselect={ resetGridSpans }
				isShownByDefault={ isShownByDefault }
				panelId={ panelId }
			>
				<FlexItem style={ { width: '50%' } }>
					<WCInputControl
						label={ __( 'Column span' ) }
						type="number"
						onChange={ ( value ) => {
							// Don't allow unsetting.
							const newColumnSpan =
								// The number input passes a string.
								value === ''
									? 1
									: parseInt( value as string, 10 );
							const constrainedValue = maxColumnSpan
								? Math.min( newColumnSpan, maxColumnSpan )
								: newColumnSpan;

							onChangeLayout( {
								columnStart,
								rowStart,
								rowSpan,
								columnSpan: constrainedValue,
								box: undefined,
							} );
						} }
						// The input renders the number as is.
						value={ columnSpanValue as unknown as string }
						min={ 1 }
						max={ maxColumnSpan }
					/>
				</FlexItem>
				<FlexItem style={ { width: '50%' } }>
					<WCInputControl
						label={ __( 'Row span' ) }
						type="number"
						onChange={ ( value ) => {
							const newRowSpan =
								// The number input passes a string.
								value === ''
									? 1
									: parseInt( value as string, 10 );
							const constrainedValue = maxRowSpan
								? Math.min( newRowSpan, maxRowSpan )
								: newRowSpan;

							onChangeLayout( {
								columnStart,
								rowStart,
								columnSpan,
								rowSpan: constrainedValue,
								box: undefined,
							} );
						} }
						// The input renders the number as is.
						value={ rowSpanValue as unknown as string }
						min={ 1 }
						max={ maxRowSpan }
					/>
				</FlexItem>
			</Flex>

			{ window.__experimentalEnableGridInteractivity && (
				// Use Flex with an explicit width on the FlexItem instead of HStack to
				// work around an issue in webkit where inputs with a max attribute are
				// sized incorrectly.
				<Flex
					as={ ToolsPanelItem }
					hasValue={ hasStartValue }
					label={ __( 'Grid placement' ) }
					onDeselect={ resetGridStarts }
					isShownByDefault={ false }
					panelId={ panelId }
				>
					<FlexItem style={ { width: '50%' } }>
						<WCInputControl
							label={ __( 'Column' ) }
							type="number"
							onChange={ ( value ) => {
								// Don't allow unsetting.
								const newColumnStart =
									// The number input passes a string.
									value === ''
										? 1
										: parseInt( value as string, 10 );
								onChangeLayout( {
									columnStart: newColumnStart,
									rowStart,
									columnSpan,
									rowSpan,
									box,
								} );
								__unstableMarkNextChangeAsNotPersistent();
								moveBlocksToPosition(
									[ panelId ],
									rootClientId,
									rootClientId,
									getNumberOfBlocksBeforeCell(
										newColumnStart,
										// Placing a block in a manual grid sets both.
										rowStart!
									)
								);
							} }
							// The input renders the number as is.
							value={ ( columnStart ?? 1 ) as unknown as string }
							min={ 1 }
							max={
								columnCount
									? columnCount - ( columnSpan ?? 1 ) + 1
									: undefined
							}
						/>
					</FlexItem>
					<FlexItem style={ { width: '50%' } }>
						<WCInputControl
							label={ __( 'Row' ) }
							type="number"
							onChange={ ( value ) => {
								// Don't allow unsetting.
								const newRowStart =
									// The number input passes a string.
									value === ''
										? 1
										: parseInt( value as string, 10 );
								onChangeLayout( {
									columnStart,
									rowStart: newRowStart,
									columnSpan,
									rowSpan,
									box,
								} );
								__unstableMarkNextChangeAsNotPersistent();
								moveBlocksToPosition(
									[ panelId ],
									rootClientId,
									rootClientId,
									getNumberOfBlocksBeforeCell(
										// Placing a block in a manual grid sets both.
										columnStart!,
										newRowStart
									)
								);
							} }
							// The input renders the number as is.
							value={ ( rowStart ?? 1 ) as unknown as string }
							min={ 1 }
							max={
								rowCount
									? rowCount - ( rowSpan ?? 1 ) + 1
									: undefined
							}
						/>
					</FlexItem>
				</Flex>
			) }
		</>
	);
}
