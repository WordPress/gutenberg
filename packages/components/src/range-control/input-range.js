// @ts-nocheck
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';

function InputRange(
	{
		describedBy,
		label,
		onHideTooltip = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		onShowTooltip = noop,
		value,
		...props
	},
	ref
) {
	const hoverInteractions = useDebouncedHoverInteraction( {
		onHide: onHideTooltip,
		onMouseLeave,
		onMouseMove,
		onShow: onShowTooltip,
	} );

	return (
		<BaseInputRange
			{ ...props }
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
