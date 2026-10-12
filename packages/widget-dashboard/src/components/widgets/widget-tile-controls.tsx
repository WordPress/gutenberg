import type { WidgetType } from '@wordpress/widget-primitives';
import { useRuntimeActions } from '../../hooks/use-runtime-actions';
import { splitWidgetActions } from '../../utils/split-widget-actions';
import { WidgetActions } from '../widget-actions';
import { WidgetAttributes } from '../widget-attributes';
import { WidgetHeader } from '../widget-header';
import { WidgetToolbar } from '../widget-toolbar';
import type { DashboardWidget } from '../../types';

interface WidgetTileControlsProps {
	widget: DashboardWidget;
	widgetType: WidgetType;

	/**
	 * Whether the policy lets the user edit the instance's attributes.
	 */
	editable: boolean;

	/**
	 * Lift the toolbar into the grid's actionable-area slot, for full-bleed
	 * widgets without an in-card header.
	 */
	overlay: boolean;
}

/**
 * One tile's normal-mode toolbar: the attribute controls and the menu
 * actions. Subscribes to the instance's runtime actions here, so a
 * declaration re-renders this toolbar alone.
 *
 * @param {WidgetTileControlsProps} props Component props.
 */
export function WidgetTileControls( {
	widget,
	widgetType,
	editable,
	overlay,
}: WidgetTileControlsProps ): React.ReactNode {
	const runtimeActions = useRuntimeActions( widget.uuid );
	const hasSettings = editable && !! widgetType.attributes?.length;
	const { menu: menuActions } = splitWidgetActions(
		widgetType,
		runtimeActions
	);

	if ( ! hasSettings && menuActions.length === 0 ) {
		return null;
	}

	const toolbar = (
		<WidgetToolbar>
			{ hasSettings && (
				<WidgetAttributes widget={ widget } widgetType={ widgetType } />
			) }

			{ menuActions.length > 0 && (
				<WidgetActions uuid={ widget.uuid } actions={ menuActions } />
			) }
		</WidgetToolbar>
	);

	return overlay ? <WidgetHeader overlay>{ toolbar }</WidgetHeader> : toolbar;
}
