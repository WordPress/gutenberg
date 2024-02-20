/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalInputControl as InputControl,
	__experimentalHStack as HStack,
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
	parentLayout,
} ) {
	const { selfStretch, flexSize, columnSpan, rowSpan } = childLayout;
	const {
		type: parentType,
		default: { type: defaultParentType = 'default' } = {},
	} = parentLayout ?? {};
	const parentLayoutType = parentType || defaultParentType;

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
				<>
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
						isBlock={ true }
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
