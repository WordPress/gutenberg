/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	CustomSelectControl,
	FlexBlock,
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
 * @param {string}   props.align
 * @return {Element} child layout edit element.
 */
export default function ChildLayoutControl( {
	value = {},
	onChange,
	parentLayout,
	align,
} ) {
	const {
		orientation = 'horizontal',
		type: parentLayoutType,
		default: { type: defaultParentLayoutType = 'default' } = {},
	} = parentLayout ?? {};

	const parentLayoutTypeToUse = parentLayoutType ?? defaultParentLayoutType;

	const { layout: childLayout = {} } = value;

	const { selfStretch, flexSize } = childLayout;

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: 'fit',
			} );
		}
	}, [] );

	const widthOptions = [
		{
			key: 'fill',
			value: 'fill',
			name: __( 'Fill' ),
		},
	];

	if ( parentLayoutTypeToUse === 'constrained' ) {
		widthOptions.push(
			{
				key: 'content',
				value: 'content',
				name: __( 'Content' ),
			},
			{
				key: 'wide',
				value: 'wide',
				name: __( 'Wide' ),
			}
		);
	} else if (
		parentLayoutTypeToUse === 'flex' &&
		orientation === 'vertical'
	) {
		widthOptions.push( {
			key: 'fit',
			value: 'fit',
			name: __( 'Fit' ),
		} );
	} else if (
		parentLayoutTypeToUse === 'flex' &&
		orientation === 'horizontal'
	) {
		widthOptions.push(
			{
				key: 'fit',
				value: 'fit',
				name: __( 'Fit' ),
			},
			{
				key: 'fixed',
				value: 'fixed',
				name: __( 'Custom' ),
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

	if ( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' ) {
		heightOptions.push(
			{
				key: 'fixed',
				value: 'fixed',
				name: __( 'Custom' ),
			},
			{
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			}
		);
	} else if (
		parentLayoutTypeToUse === 'flex' &&
		orientation === 'horizontal'
	) {
		heightOptions.push( {
			key: 'fill',
			value: 'fill',
			name: __( 'Fill' ),
		} );
	}

	const selectedWidth = (
		_selfStretch,
		_align,
		_parentLayoutTypeToUse,
		_orientation
	) => {
		let selectedValue;
		if ( _parentLayoutTypeToUse === 'constrained' ) {
			// Replace "full" with "fill" for full width alignments.
			const alignmentValue = _align === 'full' ? 'fill' : _align;
			selectedValue = alignmentValue || 'content';
		} else if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'vertical'
		) {
			selectedValue = 'fit';
		} else if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'horizontal'
		) {
			selectedValue = _selfStretch || 'fit';
		} else {
			selectedValue = 'fill';
		}

		return widthOptions.find(
			( { _value } ) => _value?.key === selectedValue
		);
	};

	const selectedHeight = (
		_selfStretch,
		_parentLayoutTypeToUse,
		_orientation
	) => {
		let selectedValue;
		if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'vertical'
		) {
			selectedValue = _selfStretch || 'fit';
		} else {
			selectedValue = 'fit';
		}
		return heightOptions.find(
			( { _value } ) => _value?.key === selectedValue
		);
	};

	const onChangeWidth = ( newWidth ) => {
		const { selectedItem } = newWidth;
		const { key } = selectedItem;
		if ( parentLayoutTypeToUse === 'constrained' ) {
			if ( key === 'fill' ) {
				onChange( {
					align: 'full',
				} );
			} else if ( key === 'wide' ) {
				onChange( {
					align: 'wide',
				} );
			} else {
				onChange( {
					align: null,
				} );
			}
		} else if (
			parentLayoutTypeToUse === 'flex' &&
			orientation === 'horizontal'
		) {
			onChange( {
				style: {
					...value,
					layout: {
						selfStretch: key,
					},
				},
			} );
		}
	};

	const onChangeHeight = ( newHeight ) => {
		if ( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' ) {
			onChange( {
				style: {
					...value,
					layout: {
						selfStretch: newHeight.selectedItem.key,
					},
				},
			} );
		}
	};

	return (
		<>
			<HStack style={ { alignItems: 'flex-end' } }>
				<FlexBlock>
					<CustomSelectControl
						label={ __( 'Width' ) }
						value={ selectedWidth(
							selfStretch,
							align,
							parentLayoutTypeToUse,
							orientation
						) }
						options={ widthOptions }
						onChange={ onChangeWidth }
						__nextUnconstrainedWidth
						__next36pxDefaultSize
					/>
				</FlexBlock>
				<FlexBlock>
					<UnitControl
						size={ '__unstable-large' }
						onChange={ ( _value ) => {
							onChange( {
								style: {
									...value,
									layout: {
										...childLayout,
										flexSize: _value,
									},
								},
							} );
						} }
						value={ flexSize }
					/>
				</FlexBlock>
			</HStack>
			<HStack style={ { alignItems: 'flex-end' } }>
				<FlexBlock>
					<CustomSelectControl
						label={ __( 'Height' ) }
						value={ selectedHeight(
							selfStretch,
							parentLayoutTypeToUse,
							orientation
						) }
						options={ heightOptions }
						onChange={ onChangeHeight }
						__nextUnconstrainedWidth
						__next36pxDefaultSize
					/>
				</FlexBlock>
				<FlexBlock>
					<UnitControl
						size={ '__unstable-large' }
						onChange={ ( _value ) => {
							onChange( {
								style: {
									...value,
									layout: {
										...childLayout,
										flexSize: _value,
									},
								},
							} );
						} }
						value={ flexSize }
					/>
				</FlexBlock>
			</HStack>
		</>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
