/**
 * External dependencies
 */
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

function UnforwardedProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'div', false >,
	ref: ForwardedRef< HTMLProgressElement >
) {
	const { className, id: idProp, value } = props;
	const id = useInstanceId( ProgressBar, 'progress-bar', idProp );
	const isIndeterminate = ! Number.isFinite( value );

	return (
		<ProgressBarStyled.Track className={ className }>
			<ProgressBarStyled.Indicator
				isIndeterminate={ isIndeterminate }
				value={ value }
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
