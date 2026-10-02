import type { Progress as _Progress } from '@base-ui/react/progress';
import type { ComponentProps } from '../utils/types';

export type RootProps = ComponentProps< typeof _Progress.Root > & {
	/**
	 * The parts of the progress indicator, including its label and value.
	 */
	children?: React.ReactNode;
};

export type TrackProps = ComponentProps< typeof _Progress.Track > & {
	/**
	 * The progress indicator to render inside the track.
	 */
	children?: React.ReactNode;
};

export type IndicatorProps = Omit<
	ComponentProps< typeof _Progress.Indicator >,
	'color'
> & {
	/**
	 * The filled indicator color. Accepts any CSS color value,
	 * including `currentColor` to inherit the surrounding text color.
	 * The track, label, and value keep their own colors.
	 */
	color?: string;
};

export type LabelProps = ComponentProps< typeof _Progress.Label > & {
	/**
	 * The visible, accessible name of the task.
	 */
	children?: React.ReactNode;
};

export type ValueProps = ComponentProps< typeof _Progress.Value > &
	Pick< React.ComponentProps< typeof _Progress.Value >, 'children' >;
