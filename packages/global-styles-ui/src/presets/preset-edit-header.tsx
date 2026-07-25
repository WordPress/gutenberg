/**
 * WordPress dependencies
 */
import {
	__experimentalSpacer as Spacer,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { ScreenHeader } from '../screen-header';
import { unlock } from '../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export interface PresetEditHeaderMenuItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}

interface PresetEditHeaderProps {
	title: string;
	description?: string;
	menuLabel: string;
	menuItems: PresetEditHeaderMenuItem[];
}

export default function PresetEditHeader( {
	title,
	description,
	menuLabel,
	menuItems,
}: PresetEditHeaderProps ) {
	return (
		<Stack justify="space-between" align="flex-start">
			<ScreenHeader title={ title } description={ description } />
			{ menuItems.length > 0 && (
				<FlexItem>
					<Spacer marginTop={ 2 } marginBottom={ 0 } paddingX={ 4 }>
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ menuLabel }
									/>
								}
							/>
							<Menu.Popover>
								{ menuItems.map( ( item ) => (
									<Menu.Item
										key={ item.label }
										disabled={ item.disabled }
										onClick={ item.onClick }
									>
										<Menu.ItemLabel>
											{ item.label }
										</Menu.ItemLabel>
									</Menu.Item>
								) ) }
							</Menu.Popover>
						</Menu>
					</Spacer>
				</FlexItem>
			) }
		</Stack>
	);
}
