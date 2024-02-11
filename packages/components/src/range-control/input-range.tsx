/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';

import type { InputRangeProps } from './types';
import type { WordPressComponentProps } from '../context';

function InputRange(
	props: WordPressComponentProps< InputRangeProps, 'input' >,
	ref: React.ForwardedRef< HTMLInputElement >
) {
	const { describedBy, label, value, ...otherProps } = props;
	return (
		<BaseInputRange
			{ ...otherProps }
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
