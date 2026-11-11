import { Switch as _Switch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Circle, Path, SVG } from '@wordpress/primitives';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.scss';
import type { SwitchProps } from './types';

const onLabel = (
	<SVG
		className={ clsx( styles.label, styles[ 'on-label' ] ) }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 8 8"
	>
		<Path
			d="M4 1.5v5"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
		/>
	</SVG>
);

const offLabel = (
	<SVG
		className={ clsx( styles.label, styles[ 'off-label' ] ) }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 8 8"
	>
		<Circle cx={ 4 } cy={ 4 } r={ 2.5 } fill="none" stroke="currentColor" />
	</SVG>
);

/**
 * A low-level switch primitive.
 *
 * Use `Field` to associate an accessible label.
 *
 * Prefer `SwitchControl` for labeled items.
 */
export const Switch = forwardRef< HTMLSpanElement, SwitchProps >(
	function UnforwardedSwitch( { className, ...props }, ref ) {
		return (
			<_Switch.Root
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.root,
					className
				) }
				{ ...props }
			>
				{ onLabel }
				{ offLabel }
				<_Switch.Thumb className={ styles.thumb } />
			</_Switch.Root>
		);
	}
);
