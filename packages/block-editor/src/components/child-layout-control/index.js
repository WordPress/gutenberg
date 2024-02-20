/**
 * WordPress dependencies
 */
import {
	CustomSelectControl,
	FlexBlock,
	__experimentalUnitControl as UnitControl,
	__experimentalInputControl as InputControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Form to edit the child layout value.
 *
 * @param {Object}   props              Props.
 * @param {Object}   props.value        The child layout value.
 * @param {Function} props.onChange     Function to update the child layout value.
 * @param {Object}   props.parentLayout The parent layout value.
 *
 * @return {Element} child layout edit element.
 */
export default function ChildLayoutControl( {
	value: childLayout = {},
	onChange,
	onChangeAlign,
	parentLayout,
} ) {
	const {
		selfStretch,
		flexSize,
		columnSpan,
		rowSpan,
		selfAlign,
		height,
		width,
	} = childLayout;
	const {
		orientation = 'horizontal',
		type: parentType,
		default: { type: defaultParentType = 'default' } = {},
		justifyContent = 'left',
		verticalAlignment = 'center',
		alignWidth = 'none',
	} = parentLayout ?? {};
	const parentLayoutType = parentType || defaultParentType;

	const isFlowOrConstrained =
		parentLayoutType === 'default' ||
		parentLayoutType === 'constrained' ||
		parentLayoutType === undefined;

	const widthProp =
		isFlowOrConstrained || orientation === 'vertical'
			? 'selfAlign'
			: 'selfStretch';
	const heightProp =
		isFlowOrConstrained || orientation === 'vertical'
			? 'selfStretch'
			: 'selfAlign';

	const widthOptions = [];

	if ( parentLayoutType === 'constrained' ) {
		widthOptions.push( {
			key: 'content',
			value: 'content',
			name: __( 'Default' ),
		} );
		if ( alignWidth === 'wide' ) {
			widthOptions.push( {
				key: 'wide',
				value: 'wide',
				name: __( 'Wide' ),
			} );
		}
		if ( alignWidth === 'full' ) {
			widthOptions.push( {
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			} );
		}
		widthOptions.push(
			{
				key: 'fit',
				value: 'fit',
				name: __( 'Fit' ),
			},
			{
				key: 'fixedNoShrink',
				value: 'fixedNoShrink',
				name: __( 'Custom' ),
			}
		);
	} else if (
		parentLayoutType === 'default' ||
		( parentLayoutType === 'flex' && orientation === 'vertical' )
	) {
		widthOptions.push(
			{
				key: 'fit',
				value: 'fit',
				name: __( 'Fit' ),
			},
			{
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			},
			{
				key: 'fixedNoShrink',
				value: 'fixedNoShrink',
				name: __( 'Fixed' ),
			}
		);
	} else if ( parentLayoutType === 'flex' && orientation === 'horizontal' ) {
		widthOptions.push(
			{
				key: 'fit',
				value: 'fit',
				name: __( 'Fit' ),
			},
			{
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			},
			{
				key: 'fixed',
				value: 'fixed',
				name: __( 'Max Width' ),
			},
			{
				key: 'fixedNoShrink',
				value: 'fixedNoShrink',
				name: __( 'Fixed' ),
			}
		);
	}

	const heightOptions = [
		{
			key: 'fit',
			value: 'fit',
			name: __( 'Fit' ),
		},
	];

	if ( parentLayoutType === 'flex' ) {
		heightOptions.push(
			{
				key: 'fixed',
				value: 'fixed',
				name: __( 'Max Height' ),
			},
			{
				key: 'fixedNoShrink',
				value: 'fixedNoShrink',
				name: __( 'Fixed' ),
			},
			{
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			}
		);
	} else {
		heightOptions.push( {
			key: 'fixedNoShrink',
			value: 'fixedNoShrink',
			name: __( 'Fixed' ),
		} );
	}

	const selectedWidth = () => {
		let selectedValue;
		if ( isFlowOrConstrained ) {
			// Replace "full" with "fill" for full width alignments.
			if ( alignWidth === 'full' ) {
				selectedValue = 'fill';
			} else if ( alignWidth === 'wide' ) {
				selectedValue = 'wide';
			} else if ( selfAlign === 'fixedNoShrink' ) {
				selectedValue = 'fixedNoShrink';
			} else if ( selfAlign === 'fit' ) {
				selectedValue = 'fit';
			} else {
				selectedValue = 'content';
			}
		} else if (
			parentLayoutType === 'flex' &&
			orientation === 'vertical'
		) {
			const defaultSelfAlign =
				justifyContent === 'stretch' ? 'fill' : 'fit';
			selectedValue = selfAlign || defaultSelfAlign;
		} else if (
			parentLayoutType === 'flex' &&
			orientation === 'horizontal'
		) {
			selectedValue = selfStretch || 'fit';
		} else {
			selectedValue = 'fill';
		}

		return widthOptions.find( ( _value ) => _value?.key === selectedValue );
	};

	const selectedHeight = () => {
		let selectedValue;
		if (
			isFlowOrConstrained ||
			( parentLayoutType === 'flex' && orientation === 'vertical' )
		) {
			selectedValue = childLayout[ heightProp ] || 'fit';
		} else if ( parentLayoutType === 'flex' ) {
			const defaultSelfAlign =
				verticalAlignment === 'stretch' ? 'fill' : 'fit';
			selectedValue = childLayout[ heightProp ] || defaultSelfAlign;
		} else {
			selectedValue = 'fit';
		}
		return heightOptions.find(
			( _value ) => _value?.key === selectedValue
		);
	};

	const onChangeWidth = ( newWidth ) => {
		const { selectedItem } = newWidth;
		const { key } = selectedItem;
		if ( isFlowOrConstrained ) {
			if ( key === 'fill' ) {
				onChange( { [ widthProp ]: key } );
				onChangeAlign( { align: 'full' } );
			} else if ( key === 'wide' ) {
				onChange( { [ widthProp ]: key } );
				onChangeAlign( { align: 'wide' } );
			} else if ( key === 'fixedNoShrink' ) {
				onChange( {
					...childLayout,
					[ widthProp ]: key,
				} );
				onChangeAlign( { align: 'none' } );
			} else {
				onChange( { [ widthProp ]: key } );
				onChangeAlign( { align: 'none' } );
			}
		} else if ( parentLayoutType === 'flex' ) {
			onChange( {
				...childLayout,
				[ widthProp ]: key,
			} );
		}
	};

	const onChangeHeight = ( newHeight ) => {
		onChange( {
			...childLayout,
			[ heightProp ]: newHeight.selectedItem.key,
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
			{ parentLayoutType !== 'grid' && (
				<>
					<HStack style={ { alignItems: 'flex-end' } }>
						<FlexBlock>
							<CustomSelectControl
								label={ __( 'Width' ) }
								value={ selectedWidth() }
								options={ widthOptions }
								onChange={ onChangeWidth }
								__nextUnconstrainedWidth
								__next40pxDefaultSize
							/>
						</FlexBlock>

						{ ( childLayout[ widthProp ] === 'fixed' ||
							childLayout[ widthProp ] === 'fixedNoShrink' ) && (
							<FlexBlock>
								<UnitControl
									__next40pxDefaultSize
									onChange={ ( _value ) => {
										onChange( {
											...childLayout,
											width: _value,
										} );
									} }
									value={ width }
								/>
							</FlexBlock>
						) }
					</HStack>
					<HStack style={ { alignItems: 'flex-end' } }>
						<FlexBlock>
							<CustomSelectControl
								label={ __( 'Height' ) }
								value={ selectedHeight() }
								options={ heightOptions }
								onChange={ onChangeHeight }
								__nextUnconstrainedWidth
								__next40pxDefaultSize
							/>
						</FlexBlock>

						{ ( childLayout[ heightProp ] === 'fixed' ||
							childLayout[ heightProp ] === 'fixedNoShrink' ) && (
							<FlexBlock>
								<UnitControl
									__next40pxDefaultSize
									onChange={ ( _value ) => {
										onChange( {
											...childLayout,
											height: _value,
										} );
									} }
									value={ height }
								/>
							</FlexBlock>
						) }
					</HStack>
				</>
			) }
			{ parentLayoutType === 'grid' && (
				<HStack>
					<InputControl
						size={ '__unstable-large' }
						label={ __( 'Column Span' ) }
						type="number"
						onChange={ ( value ) => {
							onChange( {
								rowSpan,
								columnSpan: value,
							} );
						} }
						value={ columnSpan }
						min={ 1 }
					/>
					<InputControl
						size={ '__unstable-large' }
						label={ __( 'Row Span' ) }
						type="number"
						onChange={ ( value ) => {
							onChange( {
								columnSpan,
								rowSpan: value,
							} );
						} }
						value={ rowSpan }
						min={ 1 }
					/>
				</HStack>
			) }
		</>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
