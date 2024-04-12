/**
 * External dependencies
 */
import type { CSSProperties, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as ProgressBarStyled from './styles';
import type { ProgressBarProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'progress', false >,
	ref: ForwardedRef< HTMLProgressElement >
) {
	const { className, value, ...progressProps } = props;
	const isIndeterminate = ! Number.isFinite( value );

	return (
		<ProgressBarStyled.Track className={ className }>
			<ProgressBarStyled.Indicator
				style={
					{
						'--indicator-width': ! isIndeterminate
							? `${ value }%`
							: undefined,
					} as CSSProperties
				}
				isIndeterminate={ isIndeterminate }
			/>
			<ProgressBarStyled.ProgressElement
				max={ 100 }
				value={ value }
				aria-label={ __( 'Loading …' ) }
				ref={ ref }
				{ ...progressProps }
			/>
		</ProgressBarStyled.Track>
	);
}

export const ProgressBar = forwardRef( UnforwardedProgressBar );

export default ProgressBar;
