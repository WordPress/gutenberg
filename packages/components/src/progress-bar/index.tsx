/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
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
		<div className={ wrapperClasses } style={ trackStyle }>
			<div
				className="components-progress-bar__indicator"
				style={ indicatorStyle }
			/>
			<progress max={ 100 } value={ value } />
		</div>
	);
}

export default ProgressBar;
