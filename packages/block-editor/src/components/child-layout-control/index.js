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
import { useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Form to edit the child layout value.
 *
 * @param {Object}   props              Props.
 * @param {Object}   props.value        The child layout value.
 * @param {Function} props.onChange     Function to update the child layout value.
 * @param {Object}   props.parentLayout The parent layout value.
 *
 * @param {string}   props.clientId
 * @return {Element} child layout edit element.
 */

export default function ChildLayoutControl( {
	value = {},
	onChange,
	parentLayout,
	clientId,
} ) {
	const {
		orientation = 'horizontal',
		type: parentLayoutType,
		default: { type: defaultParentLayoutType = 'default' } = {},
		justifyContent = 'left',
		verticalAlignment = 'center',
	} = parentLayout ?? {};

	const blockName = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockName( clientId ) ?? 'core/block',
		[ clientId ]
	);
	const blockSupportsAlign = getBlockSupport( blockName, 'align' );

	const blockAttributes = useSelect(
		( select ) => select( blockEditorStore ).getBlockAttributes( clientId ),
		[ clientId ]
	);

	const { align = null } = blockAttributes ?? {};

	const supportsWideAlign =
		blockSupportsAlign === true ||
		( Array.isArray( blockSupportsAlign ) &&
			blockSupportsAlign?.includes( 'wide' ) );

	const supportsFullAlign =
		blockSupportsAlign === true ||
		( Array.isArray( blockSupportsAlign ) &&
			blockSupportsAlign?.includes( 'full' ) );

	const parentLayoutTypeToUse = parentLayoutType ?? defaultParentLayoutType;

	const { layout: childLayout = {} } = value;

	const { selfStretch, selfAlign, flexSize, height, width } = childLayout;

	const isConstrained =
		parentLayoutTypeToUse === 'constrained' ||
		parentLayoutTypeToUse === 'default' ||
		parentLayoutTypeToUse === undefined;

	const widthProp =
		isConstrained || orientation === 'vertical'
			? 'selfAlign'
			: 'selfStretch';
	const heightProp =
		isConstrained || orientation === 'vertical'
			? 'selfStretch'
			: 'selfAlign';

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: 'fit',
			} );
		}
	}, [] );

	const widthOptions = [];

	if ( parentLayoutTypeToUse === 'constrained' ) {
		widthOptions.push(
			{
				key: 'content',
				value: 'content',
				name: __( 'Content' ),
			},
			{
				key: 'fixedNoShrink',
				value: 'fixedNoShrink',
				name: __( 'Fixed' ),
			},
			{
				key: 'fit',
				value: 'fit',
				name: __( 'Fit' ),
			}
		);
		if ( supportsFullAlign ) {
			widthOptions.push( {
				key: 'fill',
				value: 'fill',
				name: __( 'Fill' ),
			} );
		}
		if ( supportsWideAlign ) {
			widthOptions.push( {
				key: 'wide',
				value: 'wide',
				name: __( 'Wide' ),
			} );
		}
	} else if (
		parentLayoutTypeToUse === 'default' ||
		( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' )
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

	if ( parentLayoutTypeToUse === 'flex' ) {
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
		if ( isConstrained ) {
			// Replace "full" with "fill" for full width alignments.
			if ( align === 'full' ) {
				selectedValue = 'fill';
			} else if ( align === 'wide' ) {
				selectedValue = 'wide';
			} else if ( selfAlign === 'fixedNoShrink' ) {
				selectedValue = 'fixedNoShrink';
			} else if ( selfAlign === 'fit' ) {
				selectedValue = 'fit';
			} else {
				selectedValue = 'content';
			}
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
		if (
			isConstrained ||
			( parentLayoutTypeToUse === 'flex' && orientation === 'vertical' )
		) {
			selectedValue = childLayout[ heightProp ] || 'fit';
		} else if ( parentLayoutTypeToUse === 'flex' ) {
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
		if ( isConstrained ) {
			if ( key === 'fill' ) {
				onChange( {
					align: 'full',
					style: {
						...value,
						layout: {
							[ widthProp ]: key,
						},
					},
				} );
			} else if ( key === 'wide' ) {
				onChange( {
					align: 'wide',
					style: {
						...value,
						layout: {
							[ widthProp ]: key,
						},
					},
				} );
			} else if ( key === 'fixedNoShrink' ) {
				onChange( {
					align: null,
					style: {
						...value,
						layout: {
							...childLayout,
							[ widthProp ]: key,
						},
					},
				} );
			} else {
				onChange( {
					align: null,
					style: {
						...value,
						layout: {
							[ widthProp ]: key,
						},
					},
				} );
			}
		} else if ( parentLayoutTypeToUse === 'flex' ) {
			onChange( {
				style: {
					...value,
					layout: {
						...childLayout,
						[ widthProp ]: key,
					},
				},
			} );
		}
	};

	const onChangeHeight = ( newHeight ) => {
		onChange( {
			style: {
				...value,
				layout: {
					...childLayout,
					[ heightProp ]: newHeight.selectedItem.key,
				},
			},
		} );
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
									style: {
										...value,
										layout: {
											...childLayout,
											width: _value,
										},
									},
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
									style: {
										...value,
										layout: {
											...childLayout,
											height: _value,
										},
									},
								} );
							} }
							value={ height }
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
