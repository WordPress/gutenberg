import type { Meter as _Meter } from '@base-ui/react/meter';
import type { ComponentProps } from '../utils/types';

export type RootProps = ComponentProps< typeof _Meter.Root > & {
	/**
	 * The parts of the meter, including its label and value.
	 */
	children?: React.ReactNode;
};

export type TrackProps = ComponentProps< typeof _Meter.Track > & {
	/**
	 * The meter indicator to render inside the track.
	 */
	children?: React.ReactNode;
};

export type IndicatorProps = Omit<
	ComponentProps< typeof _Meter.Indicator >,
	'color'
> & {
	/**
	 * The color tone of the filled indicator.
	 *
	 * @default "neutral"
	 */
	tone?: 'neutral' | 'brand';
};

export type LabelProps = ComponentProps< typeof _Meter.Label > & {
	/**
	 * The visible, accessible name of the measured quantity.
	 */
	children?: React.ReactNode;
};

export type ValueProps = ComponentProps< typeof _Meter.Value > &
	Pick< React.ComponentProps< typeof _Meter.Value >, 'children' >;
