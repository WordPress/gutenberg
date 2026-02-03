import { Input as _Input } from '@base-ui/react/input';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import focusStyles from '../../../utils/css/focus.module.css';
import styles from './style.module.css';
import type { InputProps } from './types';
import { InputLayout } from '../input-layout';

export const Input = forwardRef< HTMLInputElement, InputProps >( function Input(
	{ className, size = 'default', prefix, suffix, style, ...restProps },
	ref
) {
	return (
		<InputLayout
			className={ clsx(
				focusStyles[ 'outset-ring--focus-within' ],
				className
			) }
			style={ style }
			size={ size }
			visuallyDisabled={ restProps.disabled }
			prefix={ prefix }
			suffix={ suffix }
		>
			<_Input ref={ ref } className={ styles.input } { ...restProps } />
		</InputLayout>
	);
} );
