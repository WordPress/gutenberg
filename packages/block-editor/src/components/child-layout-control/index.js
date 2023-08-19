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
		justifyContent = 'left',
		verticalAlignment = 'center',
	} = parentLayout ?? {};

	const parentLayoutTypeToUse = parentLayoutType ?? defaultParentLayoutType;

	const { layout: childLayout = {} } = value;

	const { selfStretch, selfAlign, flexSize } = childLayout;

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

	if ( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' ) {
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

	const selectedWidth = () => {
		let selectedValue;
		if ( parentLayoutTypeToUse === 'constrained' ) {
			// Replace "full" with "fill" for full width alignments.
			const alignmentValue = align === 'full' ? 'fill' : align;
			selectedValue = alignmentValue || 'content';
		} else if (
			parentLayoutTypeToUse === 'flex' &&
			orientation === 'vertical'
		) {
			const defaultSelfAlign =
				justifyContent === 'stretch' ? 'fill' : 'fit';
			selectedValue = selfAlign || defaultSelfAlign;
		} else if (
			parentLayoutTypeToUse === 'flex' &&
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
		if ( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' ) {
			selectedValue = selfStretch || 'fit';
		} else if ( parentLayoutTypeToUse === 'flex' ) {
			const defaultSelfAlign =
				verticalAlignment === 'stretch' ? 'fill' : 'fit';
			selectedValue = selfAlign || defaultSelfAlign;
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
		} else if (
			parentLayoutTypeToUse === 'flex' &&
			orientation === 'vertical'
		) {
			onChange( {
				style: {
					...value,
					layout: {
						selfAlign: key,
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
		} else if ( parentLayoutTypeToUse === 'flex' ) {
			onChange( {
				style: {
					...value,
					layout: {
						selfAlign: newHeight.selectedItem.key,
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
						value={ selectedWidth() }
						options={ widthOptions }
						onChange={ onChangeWidth }
						__nextUnconstrainedWidth
						__next36pxDefaultSize
					/>
				</FlexBlock>
				{ ( selfStretch === 'fixed' ||
					selfStretch === 'fixedNoShrink' ) &&
					orientation === 'horizontal' && (
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
						__next36pxDefaultSize
					/>
				</FlexBlock>
				{ ( selfStretch === 'fixed' ||
					selfStretch === 'fixedNoShrink' ) &&
					orientation === 'vertical' && (
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
					) }
			</HStack>
		</>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
