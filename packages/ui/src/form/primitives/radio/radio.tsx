import { Radio as _Radio } from '@base-ui/react/radio';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import styles from './style.module.css';
import type { RadioProps } from './types';

/**
 * A radio button primitive.
 *
 * Must be rendered inside a RadioGroup.
 */
export const Radio = forwardRef< HTMLSpanElement, RadioProps >( function Radio(
	{ className, ...props },
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
			{ ...props }
		>
			<_Radio.Indicator className={ styles.indicator } />
		</_Radio.Root>
	);
} );
