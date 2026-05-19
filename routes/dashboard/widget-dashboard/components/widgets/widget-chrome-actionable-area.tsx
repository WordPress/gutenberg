/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	resizeCornerNE,
	stretchFullWidth,
	stretchWide,
	trash,
} from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, IconButton, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import styles from './widget-chrome-actionable-area.module.css';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;
type WidthMode = 'custom' | NamedGridWidth;

const WIDTH_MODES: WidthMode[] = [ 'custom', 'fill', 'full' ];
const WIDTH_MODE_ICON = {
	custom: resizeCornerNE,
	fill: stretchWide,
	full: stretchFullWidth,
} as const;

interface WidgetChromeActionsProps {
	selectedWidthMode: WidthMode;
	onWidthChange: ( width: WidthMode ) => void;
}

function WidgetChromeActions( {
	selectedWidthMode,
	onWidthChange,
}: WidgetChromeActionsProps ) {
	const widthModeLabel: Record< WidthMode, string > = {
		custom: __( 'Custom width' ),
		fill: __( 'Fill width' ),
		full: __( 'Full width' ),
	};

	return (
		<Stack direction="row" align="center" gap="sm">
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ WIDTH_MODE_ICON[ selectedWidthMode ] }
							label={ __( 'Widget width' ) }
							size="small"
							variant="minimal"
							tone="neutral"
						/>
					}
				/>
				<Menu.Popover>
					<Menu.Group>
						{ WIDTH_MODES.map( ( mode ) => (
							<Menu.Item
								key={ mode }
								prefix={
									<Icon icon={ WIDTH_MODE_ICON[ mode ] } />
								}
								disabled={ selectedWidthMode === mode }
								onClick={ () => onWidthChange( mode ) }
							>
								<Menu.ItemLabel>
									{ widthModeLabel[ mode ] }
								</Menu.ItemLabel>
							</Menu.Item>
						) ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
			<IconButton
				icon={ trash }
				label={ __( 'Remove' ) }
				size="small"
				variant="minimal"
				tone="neutral"
			/>
		</Stack>
	);
}

interface WidgetChromeActionableAreaProps {
	widget: DashboardWidget< unknown >;
}

export function WidgetChromeActionableArea( {
	widget,
}: WidgetChromeActionableAreaProps ) {
	const { layout, onLayoutChange } = useDashboardInternalContext();
	const width = widget.placement?.width;
	const selectedWidthMode: WidthMode =
		typeof width === 'string' ? width : 'custom';

	const onWidthChange = ( nextWidth: WidthMode ) => {
		const nextLayout = layout.map( ( currentWidget ) =>
			currentWidget.uuid === widget.uuid
				? {
						...currentWidget,
						placement: {
							...currentWidget.placement,
							width: nextWidth === 'custom' ? 1 : nextWidth,
						},
				  }
				: currentWidget
		);
		onLayoutChange( nextLayout );
	};

	return (
		<div className={ styles.widgetChromeActionableArea }>
			<WidgetChromeActions
				selectedWidthMode={ selectedWidthMode }
				onWidthChange={ onWidthChange }
			/>
		</div>
	);
}
