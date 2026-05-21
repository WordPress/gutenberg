/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetToolbar } from '../widget-toolbar';
import styles from './widget-layout-toolbar.module.css';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;

export interface WidgetLayoutToolbarProps {
	/** The instance this toolbar manages within the layout. */
	widget: DashboardWidget< unknown >;
}

/**
 * Customize-mode per-tile toolbar: a width menu and removal, editing the
 * widget's place in the layout. Lives in the grid's `actionableArea` slot, so
 * it stays interactive while the card is `inert`.
 *
 * @param {WidgetLayoutToolbarProps} props        Component props.
 * @param {DashboardWidget}          props.widget Instance to manage.
 * @return {React.ReactNode} The layout toolbar.
 */
export function WidgetLayoutToolbar( {
	widget,
}: WidgetLayoutToolbarProps ): React.ReactNode {
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
		<WidgetToolbar className={ styles.widgetLayoutToolbar }>
			<Menu>
				<Menu.TriggerButton
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Widget options' ) }
							size="compact"
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
				size="compact"
				variant="minimal"
				tone="neutral"
				onClick={ onRemove }
			/>
		</WidgetToolbar>
	);
}
