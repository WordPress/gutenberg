/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import * as ProgressBarStyled from './styles';
import type { ProgressBarProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

// Width of the indicator for the indeterminate progress bar
export const INDETERMINATE_TRACK_WIDTH = 50;

export function ProgressBar(
	props: WordPressComponentProps< ProgressBarProps, 'div', false >
) {
	const { className, value, indicatorColor, trackColor } = props;
	const isIndeterminate = ! Number.isFinite( value );
	const wrapperClasses = classnames( 'components-progress-bar', className, {
		'is-indeterminate': isIndeterminate,
	} );
	const trackStyle = {
		backgroundColor: trackColor ? trackColor : undefined,
	};

	const indicatorStyle = {
		width: `${ isIndeterminate ? INDETERMINATE_TRACK_WIDTH : value }%`,
		backgroundColor: indicatorColor ? indicatorColor : undefined,
	};

	return (
		<ProgressBarStyled.Track
			className={ wrapperClasses }
			style={ trackStyle }
		>
			<ProgressBarStyled.Indicator style={ indicatorStyle } />
			<ProgressBarStyled.ProgressElement max={ 100 } value={ value } />
		</ProgressBarStyled.Track>
	);
}

export default ProgressBar;
