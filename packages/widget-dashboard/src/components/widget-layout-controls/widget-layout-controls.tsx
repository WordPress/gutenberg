import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Icon, IconButton, Menu } from '@wordpress/ui';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget, GridTilePlacement } from '../../types';

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;

export interface WidgetLayoutControlsProps {
	/**
	 * The instance these controls manage within the layout.
	 */
	widget: DashboardWidget< unknown >;
}

/**
 * Customize-mode controls: one menu holding removal as a command and the
 * width as a setting.
 *
 * @param {WidgetLayoutControlsProps} props Component props.
 */
export function WidgetLayoutControls( {
	widget,
}: WidgetLayoutControlsProps ): React.ReactNode {
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
		<Menu.Root>
			<Menu.Trigger
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

			<Menu.Popup>
				{ /* A numeric width matches neither item, so the group
				     reports no selection for it. */ }
				<Menu.RadioGroup
					value={ width ?? null }
					onValueChange={ onNamedWidthChange }
				>
					<Menu.GroupLabel>{ __( 'Width' ) }</Menu.GroupLabel>
					<Menu.RadioItem value="fill" closeOnClick>
						<Menu.ItemLabel>
							{ __( 'Use available width' ) }
						</Menu.ItemLabel>
					</Menu.RadioItem>
					<Menu.RadioItem value="full" closeOnClick>
						<Menu.ItemLabel>
							{ __( 'Make full width' ) }
						</Menu.ItemLabel>
					</Menu.RadioItem>
				</Menu.RadioGroup>

				<Menu.Separator />

				<Menu.Item
					prefix={ <Icon icon={ trash } /> }
					onClick={ onRemove }
				>
					<Menu.ItemLabel>{ __( 'Remove' ) }</Menu.ItemLabel>
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
