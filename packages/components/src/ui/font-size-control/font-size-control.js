/**
 * External dependencies
 */
import { contextConnect } from '@wp-g2/context';
import { VisuallyHidden, VStack } from '@wp-g2/components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FontSizeControlSelect from './select';
import FontSizeControlSlider from './slider';
import useFontSizeControl from './use-font-size-control';
import { View } from '../view';

function FontSizeControl( props, forwardedRef ) {
	const {
		options,
		inputValue,
		isDefaultValue,
		value,
		onChange,
		onReset,
		onInputChange,
		size,
		withSlider,
		withNumberInput,
		withSelect,
		...otherProps
	} = useFontSizeControl( props );

	if ( ! options ) return null;

	const label = __( 'Font size' );
	const customLabel = __( 'Custom' );
	const max = 100;
	const min = 1;

	return (
		<View as="fieldset" { ...otherProps }>
			<VisuallyHidden as="legend">{ label }</VisuallyHidden>
			<VStack spacing={ 3 }>
				<FontSizeControlSelect
					customLabel={ customLabel }
					inputValue={ inputValue }
					isDefaultValue={ isDefaultValue }
					label={ label }
					max={ max }
					min={ min }
					onChange={ onChange }
					onInputChange={ onInputChange }
					onReset={ onReset }
					options={ options }
					ref={ forwardedRef }
					size={ size }
					value={ value }
					withNumberInput={ withNumberInput }
					withSelect={ withSelect }
				/>
				<FontSizeControlSlider
					max={ max }
					min={ min }
					onChange={ onInputChange }
					size={ size }
					value={ inputValue }
					withSlider={ withSlider }
				/>
			</VStack>
		</View>
	);
}

export default contextConnect( FontSizeControl, 'FontSizeControl' );
