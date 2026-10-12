import {
	__experimentalSpacer as Spacer,
	Button,
	FlexItem,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu, Stack } from '@wordpress/ui';
import { ScreenHeader } from '../screen-header';

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
						<Menu.Root>
							<Menu.Trigger
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ menuLabel }
									/>
								}
							/>
							<Menu.Popup>
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
							</Menu.Popup>
						</Menu.Root>
					</Spacer>
				</FlexItem>
			) }
		</Stack>
	);
}
