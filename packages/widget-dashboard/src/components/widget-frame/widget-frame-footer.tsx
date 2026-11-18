import type { WidgetType } from '@wordpress/widget-primitives';
import { useRuntimeActions } from '../../hooks/use-runtime-actions';
import { splitWidgetActions } from '../../utils/split-widget-actions';
import { WidgetFooter } from '../widget-footer';
import type { DashboardWidget } from '../../types';

interface WidgetFrameFooterProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
	editMode?: boolean;
}

/**
 * The frame's footer. Subscribes to the instance's runtime actions here,
 * so a declaration never re-renders the body.
 *
 * @param {WidgetFrameFooterProps} props Component props.
 */
export function WidgetFrameFooter( {
	widget,
	widgetType,
	editMode = false,
}: WidgetFrameFooterProps ): React.ReactNode {
	const runtimeActions = useRuntimeActions( widget.uuid );
	const { footer } = splitWidgetActions( widgetType, runtimeActions );

	return (
		<WidgetFooter
			uuid={ widget.uuid }
			actions={ footer }
			editMode={ editMode }
		/>
	);
}
