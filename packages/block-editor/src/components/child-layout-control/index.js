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
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

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
		selfStretch,
		flexSize,
		columnStart,
		rowStart,
		columnSpan,
		rowSpan,
	} = childLayout;
	const {
		type: parentType,
		default: { type: defaultParentType = 'default' } = {},
		orientation = 'horizontal',
	} = parentLayout ?? {};
	const parentLayoutType = parentType || defaultParentType;

	const hasFlexValue = () => !! selfStretch;
	const flexResetLabel =
		orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
	const resetFlex = () => {
		onChange( {
			selfStretch: undefined,
			flexSize: undefined,
		} );
	};

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

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: 'fit',
			} );
		}
	}, [] );

	return (
		<>
			{ parentLayoutType === 'flex' && (
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
						size={ '__unstable-large' }
						label={ childLayoutOrientation( parentLayout ) }
						value={ selfStretch || 'fit' }
						help={ helpText( selfStretch, parentLayout ) }
						onChange={ ( value ) => {
							const newFlexSize =
								value !== 'fixed' ? null : flexSize;
							onChange( {
								selfStretch: value,
								flexSize: newFlexSize,
							} );
						} }
						isBlock
					>
						<ToggleGroupControlOption
							key={ 'fit' }
							value={ 'fit' }
							label={ __( 'Fit' ) }
						/>
						<ToggleGroupControlOption
							key={ 'fill' }
							value={ 'fill' }
							label={ __( 'Fill' ) }
						/>
						<ToggleGroupControlOption
							key={ 'fixed' }
							value={ 'fixed' }
							label={ __( 'Fixed' ) }
						/>
					</ToggleGroupControl>
					{ selfStretch === 'fixed' && (
						<UnitControl
							size={ '__unstable-large' }
							onChange={ ( value ) => {
								onChange( {
									selfStretch,
									flexSize: value,
								} );
							} }
							value={ flexSize }
						/>
					) }
				</VStack>
			) }
			{ parentLayoutType === 'grid' && (
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
							size={ '__unstable-large' }
							label={ __( 'Column span' ) }
							type="number"
							onChange={ ( value ) => {
								onChange( {
									columnStart,
									rowStart,
									rowSpan,
									columnSpan: value,
								} );
							} }
							value={ columnSpan }
							min={ 1 }
						/>
						<InputControl
							size={ '__unstable-large' }
							label={ __( 'Row span' ) }
							type="number"
							onChange={ ( value ) => {
								onChange( {
									columnStart,
									rowStart,
									columnSpan,
									rowSpan: value,
								} );
							} }
							value={ rowSpan }
							min={ 1 }
						/>
					</HStack>
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
									size={ '__unstable-large' }
									label={ __( 'Column' ) }
									type="number"
									onChange={ ( value ) => {
										onChange( {
											columnStart: value,
											rowStart,
											columnSpan,
											rowSpan,
										} );
									} }
									value={ columnStart }
									min={ 1 }
									max={
										parentLayout?.columnCount
											? parentLayout.columnCount -
											  ( columnSpan ?? 1 ) +
											  1
											: undefined
									}
								/>
							</FlexItem>
							<FlexItem style={ { width: '50%' } }>
								<InputControl
									size={ '__unstable-large' }
									label={ __( 'Row' ) }
									type="number"
									onChange={ ( value ) => {
										onChange( {
											columnStart,
											rowStart: value,
											columnSpan,
											rowSpan,
										} );
									} }
									value={ rowStart }
									min={ 1 }
									max={
										parentLayout?.rowCount
											? parentLayout.rowCount -
											  ( rowSpan ?? 1 ) +
											  1
											: undefined
									}
								/>
							</FlexItem>
						</Flex>
					) }
				</>
			) }
		</>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
