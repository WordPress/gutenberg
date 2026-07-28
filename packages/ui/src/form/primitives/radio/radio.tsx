import { Radio as _Radio } from '@base-ui/react/radio';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import focusStyles from '../../../utils/css/focus.module.css';
import styles from './style.module.css';
import type { RadioProps } from './types';

export const Radio = forwardRef< HTMLSpanElement, RadioProps >( function Radio(
	{ className, ...restProps },
	ref
) {
	return (
		<_Radio.Root
			ref={ ref }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				focusStyles[ 'outset-ring--focus' ],
				styles.root,
				className
			) }
			{ ...restProps }
		>
			<_Radio.Indicator className={ styles.indicator } />
		</_Radio.Root>
	);
} );
