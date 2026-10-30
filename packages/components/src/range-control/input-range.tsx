import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { InputRangeProps } from './types';
import type { WordPressComponentProps } from '../context';

function InputRange(
	props: WordPressComponentProps< InputRangeProps, 'input' >,
	ref: React.ForwardedRef< HTMLInputElement >
) {
	const { describedBy, label, value, className, ...otherProps } = props;
	return (
		<PolymorphicElement
			as="input"
			{ ...otherProps }
			className={ clsx( styles.input, className ) }
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
