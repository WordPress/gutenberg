import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { IconButton, Menu } from '@wordpress/ui';
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

	/**
	 * Whether the policy allows removing the instance.
	 *
	 * @default true
	 */
	canRemove?: boolean;

	/**
	 * Whether the policy allows resizing the instance.
	 *
	 * @default true
	 */
	canResize?: boolean;
}

/**
 * Customize-mode controls: width menu and removal, each following the
 * policy's answer for its operation.
 *
 * @param {WidgetLayoutControlsProps} props Component props.
 */
export function WidgetLayoutControls( {
	widget,
	canRemove = true,
	canResize = true,
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
			{ canResize && (
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
					</Menu.Popup>
				</Menu.Root>
			) }

			{ canRemove && (
				<IconButton
					icon={ trash }
					label={ __( 'Remove' ) }
					size="compact"
					variant="minimal"
					tone="neutral"
					onClick={ onRemove }
				/>
			) }
		</>
	);
}
