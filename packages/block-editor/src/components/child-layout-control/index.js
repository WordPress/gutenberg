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
	value: childLayout = {},
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

	const { selfStretch, flexSize } = childLayout;

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			onChange( {
				...childLayout,
				selfStretch: 'fit',
			} );
		}
	}, [] );

	const selectedWidth = (
		_selfStretch,
		_align,
		_parentLayoutTypeToUse,
		_orientation
	) => {
		if ( _parentLayoutTypeToUse === 'constrained' ) {
			// Replace "full" with "fill" for full width alignments.
			const alignmentValue = _align === 'full' ? 'fill' : _align;
			return alignmentValue || 'content';
		} else if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'vertical'
		) {
			return 'fit';
		} else if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'horizontal'
		) {
			return _selfStretch || 'fit';
		}
		return 'fill';
	};

	const selectedHeight = (
		_selfStretch,
		_parentLayoutTypeToUse,
		_orientation
	) => {
		if (
			_parentLayoutTypeToUse === 'flex' &&
			_orientation === 'vertical'
		) {
			return _selfStretch || 'fit';
		}
		return 'fit';
	};

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
		widthOptions.pop().push( {
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

	const onChangeWidth = () => {};

	const onChangeHeight = () => {};

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
						onChange={ ( value ) => {
							onChange( {
								...childLayout,
								flexSize: value,
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
						onChange={ ( value ) => {
							onChange( {
								...childLayout,
								flexSize: value,
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
