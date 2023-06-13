/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
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
 * @return {WPElement} child layout edit element.
 */
export default function ChildLayoutControl( {
	value: childLayout = {},
	onChange,
	parentLayout,
} ) {
	const { selfStretch, flexSize } = childLayout;

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
			<ToggleGroupControl
				__nextHasNoMarginBottom
				size={ '__unstable-large' }
				label={ childLayoutOrientation( parentLayout ) }
				value={ selfStretch || 'fit' }
				help={ helpText( selfStretch, parentLayout ) }
				onChange={ ( value ) => {
					const newFlexSize = value !== 'fixed' ? null : flexSize;
					onChange( {
						...childLayout,
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
							...childLayout,
							flexSize: value,
						} );
					} }
					value={ flexSize }
				/>
			) }
		</>
	);
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
