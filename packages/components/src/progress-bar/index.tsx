import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.scss';
import type { ProgressBarProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'progress', false >,
	ref: ForwardedRef< HTMLProgressElement >
) {
	const { className, value, ...progressProps } = props;
	const isIndeterminate = ! Number.isFinite( value );

	return (
		<div className={ clsx( styles.track, className ) }>
			<div
				className={ clsx( styles.indicator, {
					[ styles[ 'is-indeterminate' ] ]: isIndeterminate,
				} ) }
				style={ {
					'--indicator-width': ! isIndeterminate
						? `${ value }%`
						: undefined,
				} }
			/>
			<progress
				className={ styles[ 'progress-element' ] }
				max={ 100 }
				value={ value }
				aria-label={ __( 'Loading …' ) }
				ref={ ref }
				{ ...progressProps }
			/>
		</div>
	);
}

/**
 * A simple horizontal progress bar component.
 *
 * Supports two modes: determinate and indeterminate. A progress bar is determinate
 * when a specific progress value has been specified (from 0 to 100), and indeterminate
 * when a value hasn't been specified.
 *
 * ```jsx
 * import { ProgressBar } from '@wordpress/components';
 *
 * const MyLoadingComponent = () => {
 * 	return <ProgressBar />;
 * };
 * ```
 */
export const ProgressBar = forwardRef( UnforwardedProgressBar );
ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
