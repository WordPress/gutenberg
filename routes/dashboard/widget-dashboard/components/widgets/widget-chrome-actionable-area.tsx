/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton, Stack } from '@wordpress/ui';

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

interface WidgetChromeActionsProps {
	width: GridTilePlacement[ 'width' ];
	onNamedWidthChange: ( width: NamedGridWidth ) => void;
	onRemove: () => void;
}

function WidgetChromeActions( {
	width,
	onNamedWidthChange,
	onRemove,
}: WidgetChromeActionsProps ) {
	return (
		<Stack direction="row" align="center" gap="sm">
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Widget options' ) }
							size="small"
							variant="minimal"
							tone="neutral"
						/>
					}
				/>
				<Menu.Popover>
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Width' ) }</Menu.GroupLabel>
						<Menu.Item
							disabled={ width === 'fill' }
							onClick={ () => onNamedWidthChange( 'fill' ) }
						>
							<Menu.ItemLabel>
								{ __( 'Use available width' ) }
							</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Item
							disabled={ width === 'full' }
							onClick={ () => onNamedWidthChange( 'full' ) }
						>
							<Menu.ItemLabel>
								{ __( 'Make full width' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					</Menu.Group>
				</Menu.Popover>
			</Menu>
			<IconButton
				icon={ trash }
				label={ __( 'Remove' ) }
				size="small"
				variant="minimal"
				tone="neutral"
				onClick={ onRemove }
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

	const updateWidth = ( nextWidth: GridTilePlacement[ 'width' ] ) => {
		const nextLayout = layout.map( ( currentWidget ) =>
			currentWidget.uuid === widget.uuid
				? {
						...currentWidget,
						placement: {
							...currentWidget.placement,
							width: nextWidth,
						},
				  }
				: currentWidget
		);
		onLayoutChange( nextLayout );
	};

	const onNamedWidthChange = ( nextWidth: NamedGridWidth ) => {
		updateWidth( nextWidth );
	};

	const onRemove = () => {
		onLayoutChange(
			layout.filter(
				( currentWidget ) => currentWidget.uuid !== widget.uuid
			)
		);
	};

	return (
		<div className={ styles.widgetChromeActionableArea }>
			<WidgetChromeActions
				width={ width }
				onNamedWidthChange={ onNamedWidthChange }
				onRemove={ onRemove }
			/>
		</div>
	);
}
