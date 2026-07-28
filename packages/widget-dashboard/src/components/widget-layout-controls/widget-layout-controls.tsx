/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

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
 * Customize-mode controls: width menu and removal.
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
		<>
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
		</>
	);
}
