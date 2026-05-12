/**
 * Internal dependencies
 */
import { useOnThisDayPost } from './hooks/use-on-this-day-post';
import type { TimeRange } from './hooks/use-on-this-day-post';
import {
	OnThisDayView,
	type BackgroundEffect,
} from './components/on-this-day-view';

interface OnThisDayAttributes {
	timeRange?: TimeRange;
	customDate?: string;
	effect?: BackgroundEffect;
}

interface OnThisDayProps {
	attributes: OnThisDayAttributes;
}

/**
 * Renders a published post resolved by the selected time range. The
 * surrounding surface owns the chrome (header, footer, error boundary);
 * this component emits only the widget body, delegating layout to
 * @param { OnThisDayProps } props - The props for the On This Day widget.
 */
export default function OnThisDay( { attributes }: OnThisDayProps ) {
	const data = useOnThisDayPost( {
		timeRange: attributes.timeRange,
		customDate: attributes.customDate,
	} );

	return <OnThisDayView { ...data } effect={ attributes.effect } />;
}
