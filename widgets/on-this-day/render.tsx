/**
 * Internal dependencies
 */
import type { WidgetRenderProps } from '../../routes/dashboard/widget-types';
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

/**
 * Renders a published post resolved by the selected time range. The
 * surrounding surface owns the chrome (header, footer, error boundary);
 * this component emits only the widget body, delegating layout to
 * {@link OnThisDayView}.
 *
 * @param props            Component props.
 * @param props.attributes Widget attributes set on this instance.
 */
export default function OnThisDay( {
	attributes,
}: WidgetRenderProps< OnThisDayAttributes > ) {
	const data = useOnThisDayPost( {
		timeRange: attributes.timeRange,
		customDate: attributes.customDate,
	} );

	return <OnThisDayView { ...data } effect={ attributes.effect } />;
}
