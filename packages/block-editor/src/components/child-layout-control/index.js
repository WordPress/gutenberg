/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalInputControl as InputControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
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

function helpText( selfStretch, parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	if ( selfStretch === 'fill' ) {
		return __( 'Stretch to fill available space.' );
	}
	if ( selfStretch === 'fixed' && orientation === 'horizontal' ) {
		return __( 'Specify a fixed width.' );
	} else if ( selfStretch === 'fixed' ) {
		return __( 'Specify a fixed height.' );
	}
	return __( 'Fit contents.' );
}

/**
 * Form to edit the child layout value.
 *
 * @param {Object}   props                  Props.
 * @param {Object}   props.value            The child layout value.
 * @param {Function} props.onChange         Function to update the child layout value.
 * @param {Object}   props.parentLayout     The parent layout value.
 *
 * @param {boolean}  props.isShownByDefault
 * @param {string}   props.panelId
 * @return {Element} child layout edit element.
 */
export default function ChildLayoutControl( {
	value: childLayout = {},
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
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
	const hasFlexValue = () => !! selfStretch;
	const flexResetLabel =
		orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
	const resetFlex = () => {
		onChange( {
			selfStretch: undefined,
			flexSize: undefined,
		} );
	};

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: 'fit',
			} );
		}
	}, [] );

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
				__nextHasNoMarginBottom
				size="__unstable-large"
				label={ childLayoutOrientation( parentLayout ) }
				value={ selfStretch || 'fit' }
				help={ helpText( selfStretch, parentLayout ) }
				onChange={ ( value ) => {
					const newFlexSize = value !== 'fixed' ? null : flexSize;
					onChange( {
						selfStretch: value,
						flexSize: newFlexSize,
					} );
				} }
				isBlock
			>
				<ToggleGroupControlOption
					key="fit"
					value="fit"
					label={ _x(
						'Fit',
						'Intrinsic block width in flex layout'
					) }
				/>
				<ToggleGroupControlOption
					key="fill"
					value="fill"
					label={ _x(
						'Grow',
						'Block with expanding width in flex layout'
					) }
				/>
				<ToggleGroupControlOption
					key="fixed"
					value="fixed"
					label={ _x(
						'Fixed',
						'Block with fixed width in flex layout'
					) }
				/>
			</ToggleGroupControl>
			{ selfStretch === 'fixed' && (
				<UnitControl
					size="__unstable-large"
					onChange={ ( value ) => {
						onChange( {
							selfStretch,
							flexSize: value,
						} );
					} }
					value={ flexSize }
					label={ flexResetLabel }
					hideLabelFromVision
				/>
			) }
		</VStack>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;
	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}

function GridControls( {
	childLayout,
	onChange,
	parentLayout,
	isShownByDefault,
	panelId,
} ) {
	const { columnStart, rowStart, columnSpan, rowSpan } = childLayout;
	const { columnCount = 3, rowCount } = parentLayout ?? {};
	const rootClientId = useSelect( ( select ) =>
		select( blockEditorStore ).getBlockRootClientId( panelId )
	);
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		rootClientId,
		columnCount
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

	return (
		<>
			<HStack
				as={ ToolsPanelItem }
				hasValue={ hasSpanValue }
				label={ __( 'Grid span' ) }
				onDeselect={ resetGridSpans }
				isShownByDefault={ isShownByDefault }
				panelId={ panelId }
			>
				<InputControl
					size="__unstable-large"
					label={ __( 'Column span' ) }
					type="number"
					onChange={ ( value ) => {
						// Don't allow unsetting.
						const newColumnSpan =
							value === '' ? 1 : parseInt( value, 10 );
						onChange( {
							columnStart,
							rowStart,
							rowSpan,
							columnSpan: newColumnSpan,
						} );
					} }
					value={ columnSpan ?? 1 }
					min={ 1 }
				/>
				<InputControl
					size="__unstable-large"
					label={ __( 'Row span' ) }
					type="number"
					onChange={ ( value ) => {
						// Don't allow unsetting.
						const newRowSpan =
							value === '' ? 1 : parseInt( value, 10 );
						onChange( {
							columnStart,
							rowStart,
							columnSpan,
							rowSpan: newRowSpan,
						} );
					} }
					value={ rowSpan ?? 1 }
					min={ 1 }
				/>
			</HStack>
			{ window.__experimentalEnableGridInteractivity && columnCount && (
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
