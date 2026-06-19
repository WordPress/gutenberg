/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useGetNumberOfBlocksBeforeCell } from '../grid/use-get-number-of-blocks-before-cell';
import { store as blockEditorStore } from '../../store';
import { useSettings } from '../use-settings';

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

function isFlexSizeValue( value ) {
	return FLEX_SIZE_VALUES.includes( value );
}

function maxSizeLabel( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout ?? {};
	return orientation === 'horizontal'
		? _x( 'Max', 'Block with maximum width in flex layout' )
		: _x( 'Max', 'Block with maximum height in flex layout' );
}

function helpText( flexControlValue, parentLayout ) {
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
 * @param {Object}   props                      Props.
 * @param {Object}   props.value                The child layout value.
 * @param {Function} props.onChange             Function to update the child layout value.
 * @param {Object}   props.parentLayout         The parent layout value.
 *
 * @param {boolean}  props.isShownByDefault     Whether the control is shown by default.
 * @param {string}   props.panelId              The panel ID.
 * @param {boolean}  props.showGridSpanDefaults Whether unset grid span controls should show default values.
 * @return {Element} child layout edit element.
 */
export default function ChildLayoutControl( {
	value: childLayout = {},
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
	showGridSpanDefaults = true,
} ) {
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
} ) {
	const { selfStretch, flexSize } = childLayout;
	const { orientation = 'horizontal' } = parentLayout ?? {};
	const flexControlValue = selfStretch || FLEX_CHILD_LAYOUT_VALUES.fit;
	const hasFlexSizeValue = isFlexSizeValue( flexControlValue );
	const hasFlexValue = () => !! selfStretch;
	const flexResetLabel =
		orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [
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
				size="__unstable-large"
				label={ childLayoutOrientation( parentLayout ) }
				value={ flexControlValue }
				help={ helpText( flexControlValue, parentLayout ) }
				onChange={ ( value ) => {
					const newFlexSize = isFlexSizeValue( value )
						? flexSize
						: null;
					onChange( {
						selfStretch: value,
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
					size="__unstable-large"
					units={ units }
					onChange={ ( value ) => {
						onChange( {
							selfStretch: flexControlValue,
							flexSize: value,
						} );
					} }
					value={ flexSize }
					min={ 0 }
					label={ flexResetLabel }
					hideLabelFromVision
				/>
			) }
		</VStack>
	);
}

export function childLayoutOrientation( parentLayout ) {
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
} ) {
	const { columnStart, rowStart, columnSpan, rowSpan } = childLayout;
	const { columnCount, rowCount } = parentLayout ?? {};
	const rootClientId = useSelect( ( select ) =>
		select( blockEditorStore ).getBlockRootClientId( panelId )
	);
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		rootClientId,
		columnCount || 3
	);
	const hasStartValue = () => !! columnStart || !! rowStart;
	const hasSpanValue = () => !! columnSpan || !! rowSpan;
	const resetGridStarts = () => {
		onChange( {
			columnStart: undefined,
			rowStart: undefined,
		} );
	};
	const resetGridSpans = () => {
		onChange( {
			columnSpan: undefined,
			rowSpan: undefined,
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
					<InputControl
						size="__unstable-large"
						label={ __( 'Column span' ) }
						type="number"
						onChange={ ( value ) => {
							// Don't allow unsetting.
							const newColumnSpan =
								value === '' ? 1 : parseInt( value, 10 );
							const constrainedValue = maxColumnSpan
								? Math.min( newColumnSpan, maxColumnSpan )
								: newColumnSpan;

							onChange( {
								columnStart,
								rowStart,
								rowSpan,
								columnSpan: constrainedValue,
							} );
						} }
						value={ columnSpanValue }
						min={ 1 }
						max={ maxColumnSpan }
					/>
				</FlexItem>
				<FlexItem style={ { width: '50%' } }>
					<InputControl
						size="__unstable-large"
						label={ __( 'Row span' ) }
						type="number"
						onChange={ ( value ) => {
							const newRowSpan =
								value === '' ? 1 : parseInt( value, 10 );
							const constrainedValue = maxRowSpan
								? Math.min( newRowSpan, maxRowSpan )
								: newRowSpan;

							onChange( {
								columnStart,
								rowStart,
								columnSpan,
								rowSpan: constrainedValue,
							} );
						} }
						value={ rowSpanValue }
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
						<InputControl
							size="__unstable-large"
							label={ __( 'Column' ) }
							type="number"
							onChange={ ( value ) => {
								// Don't allow unsetting.
								const newColumnStart =
									value === '' ? 1 : parseInt( value, 10 );
								onChange( {
									columnStart: newColumnStart,
									rowStart,
									columnSpan,
									rowSpan,
								} );
								__unstableMarkNextChangeAsNotPersistent();
								moveBlocksToPosition(
									[ panelId ],
									rootClientId,
									rootClientId,
									getNumberOfBlocksBeforeCell(
										newColumnStart,
										rowStart
									)
								);
							} }
							value={ columnStart ?? 1 }
							min={ 1 }
							max={
								columnCount
									? columnCount - ( columnSpan ?? 1 ) + 1
									: undefined
							}
						/>
					</FlexItem>
					<FlexItem style={ { width: '50%' } }>
						<InputControl
							size="__unstable-large"
							label={ __( 'Row' ) }
							type="number"
							onChange={ ( value ) => {
								// Don't allow unsetting.
								const newRowStart =
									value === '' ? 1 : parseInt( value, 10 );
								onChange( {
									columnStart,
									rowStart: newRowStart,
									columnSpan,
									rowSpan,
								} );
								__unstableMarkNextChangeAsNotPersistent();
								moveBlocksToPosition(
									[ panelId ],
									rootClientId,
									rootClientId,
									getNumberOfBlocksBeforeCell(
										columnStart,
										newRowStart
									)
								);
							} }
							value={ rowStart ?? 1 }
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
