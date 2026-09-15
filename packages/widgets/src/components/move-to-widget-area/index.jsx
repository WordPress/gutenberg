import { Button, ToolbarGroup, ToolbarItem } from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { moveTo } from '@wordpress/icons';

export default function MoveToWidgetArea( {
	currentWidgetAreaId,
	widgetAreas,
	onSelect,
} ) {
	return (
		<ToolbarGroup>
			<Menu.Root>
				<ToolbarItem>
					{ ( toggleProps ) => (
						<Menu.Trigger
							render={
								<Button
									{ ...toggleProps }
									size="compact"
									icon={ moveTo }
									label={ __( 'Move to widget area' ) }
									showTooltip
								/>
							}
						/>
					) }
				</ToolbarItem>
				<Menu.Popup>
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Move to' ) }</Menu.GroupLabel>
						<Menu.RadioGroup
							value={ currentWidgetAreaId }
							onValueChange={ ( value ) => {
								if ( value !== currentWidgetAreaId ) {
									onSelect( value );
								}
							} }
						>
							{ widgetAreas.map( ( widgetArea ) => (
								<Menu.RadioItem
									key={ widgetArea.id }
									value={ widgetArea.id }
									closeOnClick={
										widgetArea.id !== currentWidgetAreaId
									}
								>
									<Menu.ItemLabel>
										{ widgetArea.name }
									</Menu.ItemLabel>
									{ widgetArea.description && (
										<Menu.ItemDescription>
											{ widgetArea.description }
										</Menu.ItemDescription>
									) }
								</Menu.RadioItem>
							) ) }
						</Menu.RadioGroup>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
		</ToolbarGroup>
	);
}
