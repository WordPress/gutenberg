/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';

import type { InputRangeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

const noop = () => {};

function InputRange(
	props: WordPressComponentProps< InputRangeProps, 'input' >,
	ref: React.ForwardedRef< HTMLInputElement >
) {
	const {
		describedBy,
		label,
		onHideTooltip = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		onShowTooltip = noop,
		value,
		...otherProps
	} = props;

	const hoverInteractions = useDebouncedHoverInteraction( {
		onHide: onHideTooltip,
		onMouseLeave,
		onMouseMove,
		onShow: onShowTooltip,
	} );

	return (
		<BaseInputRange
			{ ...otherProps }
			{ ...hoverInteractions }
			aria-describedby={ describedBy }
			aria-label={ label }
			aria-hidden={ false }
			ref={ ref }
			tabIndex={ 0 }
			type="range"
			value={ value }
		/>
	);
}

const ForwardedComponent = forwardRef( InputRange );

export default ForwardedComponent;
