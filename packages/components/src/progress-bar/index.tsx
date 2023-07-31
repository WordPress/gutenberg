/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import * as ProgressBarStyled from './styles';
import type { ProgressBarProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

// Width of the indicator for the indeterminate progress bar
export const INDETERMINATE_TRACK_WIDTH = 50;

function UnforwardedProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'div', false >,
	ref: ForwardedRef< HTMLProgressElement >
) {
	const { className, id: idProp, value } = props;
	const id = useInstanceId( ProgressBar, 'progress-bar', idProp );
	const isIndeterminate = ! Number.isFinite( value );
	const wrapperClasses = classnames( className, {
		/**
		 * @todo Use the `:indeterminate` pseudo-class once supported.
		 *
		 * @see https://caniuse.com/mdn-css_selectors_indeterminate_progress
		 */
		'is-indeterminate': isIndeterminate,
	} );

	return (
		<ProgressBarStyled.Track className={ wrapperClasses }>
			<ProgressBarStyled.Indicator
				style={ {
					width: `${
						isIndeterminate ? INDETERMINATE_TRACK_WIDTH : value
					}%`,
				} }
			/>
			<ProgressBarStyled.ProgressElement
				max={ 100 }
				value={ value }
				aria-label={ __( 'Loading …' ) }
				id={ id }
				ref={ ref }
			/>
		</ProgressBarStyled.Track>
	);
}

export const ProgressBar = forwardRef( UnforwardedProgressBar );

export default ProgressBar;
