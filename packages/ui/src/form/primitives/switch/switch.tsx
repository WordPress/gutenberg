import { Switch as _Switch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Path, SVG } from '@wordpress/primitives';
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
			d="M1.5 4.25 3.25 6 6.5 2"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</SVG>
);

const offLabel = (
	<SVG
		className={ clsx( styles.label, styles[ 'off-label' ] ) }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 8 8"
	>
		<Path
			d="M2 2l4 4M6 2 2 6"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
		/>
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
