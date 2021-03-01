/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
import { createUnitValue, is, noop } from '@wp-g2/utils';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import {
	getInputValue,
	getSelectOptions,
	getSelectValueFromFontSize,
	hasUnit,
	isCustomSelectedItem,
	isCustomValue,
} from './utils';

export default function useFontSizeControl( props ) {
	const {
		disableCustomFontSizes,
		fontSizes = [],
		onChange = noop,
		value,
		withSlider = false,
		className,
		...otherProps
	} = useContextSystem( props );

	const hasUnits = hasUnit( value || fontSizes[ 0 ]?.size );

	const hasCustomValue = isCustomValue( fontSizes, value );

	const options = useMemo(
		() =>
			getSelectOptions( {
				options: fontSizes,
				disableCustomFontSizes,
				hasCustomValue,
			} ),
		[ fontSizes, disableCustomFontSizes, hasCustomValue ]
	);

	const handleOnReset = useCallback( () => {
		onChange( undefined );
	}, [ onChange ] );

	const handleOnChange = useCallback(
		( { selectedItem } ) => {
			if ( isCustomSelectedItem( selectedItem ) ) return;

			if ( hasUnits ) {
				onChange( selectedItem.size );
			} else if ( is.defined( selectedItem.size ) ) {
				onChange( Number( selectedItem.size ) );
			} else {
				handleOnReset();
			}
		},
		[ handleOnReset, hasUnits, onChange ]
	);

	const handleOnInputChange = useCallback(
		( next ) => {
			if ( ! next && next !== 0 ) {
				handleOnReset();
				return;
			}
			if ( hasUnits ) {
				onChange( createUnitValue( next, 'px' ) );
			} else {
				onChange( Number( next ) );
			}
		},
		[ handleOnReset, hasUnits, onChange ]
	);

	const inputValue = getInputValue( fontSizes, value );

	const selectedFontSizeSlug = getSelectValueFromFontSize( fontSizes, value );
	const currentValue = options.find(
		( option ) => option.key === selectedFontSizeSlug
	);

	const isDefaultValue = ! is.defined( value, className );

	const classes = cx( styles.FontSizeControl );

	const withSelect = fontSizes.length > 0;
	const withNumberInput = ! withSlider && ! disableCustomFontSizes;

	return {
		...otherProps,
		className: classes,
		inputValue,
		isDefaultValue,
		onChange: handleOnChange,
		onInputChange: handleOnInputChange,
		onReset: handleOnReset,
		options,
		value: currentValue,
		withNumberInput,
		withSelect,
		withSlider,
	};
}
