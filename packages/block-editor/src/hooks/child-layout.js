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

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';

function helpText( selfStretch, parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	if ( selfStretch === 'fill' ) {
		return __( 'Stretch to fill available space.' );
	}
	if ( selfStretch === 'fixed' ) {
		if ( orientation === 'horizontal' ) {
			return __( 'Specify a fixed width.' );
		}
		return __( 'Specify a fixed height.' );
	}
	return __( 'Fit contents.' );
}

/**
 * Inspector controls containing the child layout related configuration.
 *
 * @param {Object} props                        Block props.
 * @param {Object} props.attributes             Block attributes.
 * @param {Object} props.setAttributes          Function to set block attributes.
 * @param {Object} props.__unstableParentLayout
 *
 * @return {WPElement} child layout edit element.
 */
export function ChildLayoutEdit( {
	attributes,
	setAttributes,
	__unstableParentLayout: parentLayout,
} ) {
	const { style = {} } = attributes;
	const { layout: childLayout = {} } = style;
	const { selfStretch, flexSize } = childLayout;

	useEffect( () => {
		if ( selfStretch === 'fixed' && ! flexSize ) {
			setAttributes( {
				style: {
					...style,
					layout: {
						...childLayout,
						selfStretch: 'fit',
					},
				},
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
					setAttributes( {
						style: {
							...style,
							layout: {
								...childLayout,
								selfStretch: value,
								flexSize: newFlexSize,
							},
						},
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
						setAttributes( {
							style: {
								...style,
								layout: {
									...childLayout,
									flexSize: value,
								},
							},
						} );
					} }
					value={ flexSize }
				/>
			) }
		</>
	);
}

/**
 * Determines if there is child layout support.
 *
 * @param {Object} props                        Block Props object.
 * @param {Object} props.__unstableParentLayout Parent layout.
 *
 * @return {boolean}     Whether there is support.
 */
export function hasChildLayoutSupport( {
	__unstableParentLayout: parentLayout = {},
} ) {
	const {
		type: parentLayoutType = 'default',
		default: { type: defaultParentLayoutType = 'default' } = {},
		allowSizingOnChildren = false,
	} = parentLayout;

	const support =
		( defaultParentLayoutType === 'flex' || parentLayoutType === 'flex' ) &&
		allowSizingOnChildren;

	return support;
}

/**
 * Checks if there is a current value in the child layout attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}      Whether or not the block has a child layout value set.
 */
export function hasChildLayoutValue( props ) {
	return props.attributes.style?.layout !== undefined;
}

/**
 * Resets the child layout attribute. This can be used when disabling
 * child layout controls for a block via a progressive discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block attributes.
 * @param {Object} props.setAttributes Function to set block attributes.
 */
export function resetChildLayout( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: {
			...style,
			layout: undefined,
		},
	} );
}

/**
 * Custom hook that checks if child layout settings have been disabled.
 *
 * @param {Object} props Block props.
 *
 * @return {boolean}     Whether the child layout setting is disabled.
 */
export function useIsChildLayoutDisabled( props ) {
	const isDisabled = ! useSetting( 'layout' );

	return ! hasChildLayoutSupport( props ) || isDisabled;
}

export function childLayoutOrientation( parentLayout ) {
	const { orientation = 'horizontal' } = parentLayout;

	return orientation === 'horizontal' ? __( 'Width' ) : __( 'Height' );
}
