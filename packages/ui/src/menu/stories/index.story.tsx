import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { customLink, formatCapitalize } from '@wordpress/icons';
import { Button } from '../../button';
import { Icon } from '../../icon';
import { Menu } from '../index';

const meta: Meta< typeof Menu.Root > = {
	title: 'Design System/Components/Menu',
	component: Menu.Root,
	subcomponents: {
		'Menu.Trigger': Menu.Trigger,
		'Menu.Positioner': Menu.Positioner,
		'Menu.Popup': Menu.Popup,
		'Menu.Item': Menu.Item,
		'Menu.ItemLabel': Menu.ItemLabel,
		'Menu.ItemHelpText': Menu.ItemHelpText,
		'Menu.CheckboxItem': Menu.CheckboxItem,
		'Menu.RadioGroup': Menu.RadioGroup,
		'Menu.RadioItem': Menu.RadioItem,
		'Menu.Group': Menu.Group,
		'Menu.GroupLabel': Menu.GroupLabel,
		'Menu.Separator': Menu.Separator,
		'Menu.SubmenuRoot': Menu.SubmenuRoot,
		'Menu.SubmenuTriggerItem': Menu.SubmenuTriggerItem,
	},
	argTypes: {
		children: { control: false },
	},
};

export default meta;

type Story = StoryObj< typeof Menu.Root >;

export const Default: Story = {
	render: () => (
		<Menu.Root>
			<Menu.Trigger
				render={ <Button variant="outline" tone="neutral" /> }
			>
				Open menu
			</Menu.Trigger>

			<Menu.Portal>
				<Menu.Positioner sideOffset={ 8 }>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Label</Menu.ItemLabel>
						</Menu.Item>

						<Menu.Item>
							<Menu.ItemLabel>Label</Menu.ItemLabel>
							<Menu.ItemHelpText>Help text</Menu.ItemHelpText>
						</Menu.Item>

						<Menu.Item>
							<Menu.ItemLabel>Label</Menu.ItemLabel>
							<Menu.ItemHelpText>
								The menu item help text is automatically
								truncated when there are more than two lines of
								text.
							</Menu.ItemHelpText>
						</Menu.Item>

						<Menu.Item closeOnClick={ false }>
							<Menu.ItemLabel>Label</Menu.ItemLabel>
							<Menu.ItemHelpText>
								This item does not close the menu on click.
							</Menu.ItemHelpText>
						</Menu.Item>

						<Menu.Item disabled>
							<Menu.ItemLabel>Disabled item</Menu.ItemLabel>
						</Menu.Item>

						<Menu.Separator />

						<Menu.Group>
							<Menu.GroupLabel>Group label</Menu.GroupLabel>

							<Menu.Item
								prefix={
									<Icon icon={ customLink } size={ 24 } />
								}
							>
								<Menu.ItemLabel>With prefix</Menu.ItemLabel>
							</Menu.Item>

							<Menu.Item suffix="⌘S">
								<Menu.ItemLabel>With suffix</Menu.ItemLabel>
							</Menu.Item>

							<Menu.Item
								disabled
								prefix={
									<Icon
										icon={ formatCapitalize }
										size={ 24 }
									/>
								}
								suffix="⌥⌘T"
							>
								<Menu.ItemLabel>
									Disabled with prefix and suffix
								</Menu.ItemLabel>
								<Menu.ItemHelpText>
									And help text
								</Menu.ItemHelpText>
							</Menu.Item>
						</Menu.Group>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	),
};

export const WithSubmenu: Story = {
	render: () => (
		<Menu.Root>
			<Menu.Trigger
				render={ <Button variant="outline" tone="neutral" /> }
			>
				Open menu
			</Menu.Trigger>

			<Menu.Portal>
				<Menu.Positioner sideOffset={ 8 }>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
						</Menu.Item>

						<Menu.SubmenuRoot>
							<Menu.SubmenuTriggerItem suffix="⌘K">
								<Menu.ItemLabel>
									Submenu trigger item with a long label
								</Menu.ItemLabel>
							</Menu.SubmenuTriggerItem>

							<Menu.Portal>
								<Menu.Positioner sideOffset={ 0 }>
									<Menu.Popup>
										<Menu.Item>
											<Menu.ItemLabel>
												Level 2 item
											</Menu.ItemLabel>
										</Menu.Item>
										<Menu.Item>
											<Menu.ItemLabel>
												Level 2 item
											</Menu.ItemLabel>
										</Menu.Item>

										<Menu.SubmenuRoot>
											<Menu.SubmenuTriggerItem>
												<Menu.ItemLabel>
													Submenu trigger
												</Menu.ItemLabel>
											</Menu.SubmenuTriggerItem>
											<Menu.Portal>
												<Menu.Positioner
													sideOffset={ 0 }
												>
													<Menu.Popup>
														<Menu.Item>
															<Menu.ItemLabel>
																Level 3 item
															</Menu.ItemLabel>
														</Menu.Item>
														<Menu.Item>
															<Menu.ItemLabel>
																Level 3 item
															</Menu.ItemLabel>
														</Menu.Item>
													</Menu.Popup>
												</Menu.Positioner>
											</Menu.Portal>
										</Menu.SubmenuRoot>
									</Menu.Popup>
								</Menu.Positioner>
							</Menu.Portal>
						</Menu.SubmenuRoot>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	),
};

export const WithCheckboxes: Story = {
	render: () => {
		const [ isAChecked, setAChecked ] = useState( false );
		const [ isBChecked, setBChecked ] = useState( true );
		const [ isMultipleAChecked, setMultipleAChecked ] = useState( false );
		const [ isMultipleBChecked, setMultipleBChecked ] = useState( true );

		return (
			<Menu.Root>
				<Menu.Trigger
					render={ <Button variant="outline" tone="neutral" /> }
				>
					Open menu
				</Menu.Trigger>

				<Menu.Portal>
					<Menu.Positioner sideOffset={ 8 }>
						<Menu.Popup>
							<Menu.Group>
								<Menu.GroupLabel>
									Single selection, uncontrolled
								</Menu.GroupLabel>
								<Menu.CheckboxItem suffix="⌘P">
									<Menu.ItemLabel>
										Checkbox item A
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially unchecked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
								<Menu.CheckboxItem defaultChecked>
									<Menu.ItemLabel>
										Checkbox item B
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially checked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
							</Menu.Group>

							<Menu.Separator />

							<Menu.Group>
								<Menu.GroupLabel>
									Single selection, controlled
								</Menu.GroupLabel>
								<Menu.CheckboxItem
									checked={ isAChecked }
									onCheckedChange={ ( checked ) =>
										setAChecked( checked === true )
									}
								>
									<Menu.ItemLabel>
										Checkbox item A
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially unchecked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
								<Menu.CheckboxItem
									checked={ isBChecked }
									onCheckedChange={ ( checked ) =>
										setBChecked( checked === true )
									}
								>
									<Menu.ItemLabel>
										Checkbox item B
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially checked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
							</Menu.Group>

							<Menu.Separator />

							<Menu.Group>
								<Menu.GroupLabel>
									Multiple selection, uncontrolled
								</Menu.GroupLabel>
								<Menu.CheckboxItem>
									<Menu.ItemLabel>
										Checkbox item A
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially unchecked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
								<Menu.CheckboxItem defaultChecked>
									<Menu.ItemLabel>
										Checkbox item B
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially checked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
							</Menu.Group>

							<Menu.Separator />

							<Menu.Group>
								<Menu.GroupLabel>
									Multiple selection, controlled
								</Menu.GroupLabel>
								<Menu.CheckboxItem
									checked={ isMultipleAChecked }
									onCheckedChange={ ( checked ) =>
										setMultipleAChecked( checked === true )
									}
								>
									<Menu.ItemLabel>
										Checkbox item A
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially unchecked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
								<Menu.CheckboxItem
									checked={ isMultipleBChecked }
									onCheckedChange={ ( checked ) =>
										setMultipleBChecked( checked === true )
									}
								>
									<Menu.ItemLabel>
										Checkbox item B
									</Menu.ItemLabel>
									<Menu.ItemHelpText>
										Initially checked
									</Menu.ItemHelpText>
								</Menu.CheckboxItem>
							</Menu.Group>
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.Root>
		);
	},
};

export const WithRadios: Story = {
	render: () => {
		const [ radioValue, setRadioValue ] = useState( 'two' );

		return (
			<Menu.Root>
				<Menu.Trigger
					render={ <Button variant="outline" tone="neutral" /> }
				>
					Open menu
				</Menu.Trigger>

				<Menu.Portal>
					<Menu.Positioner sideOffset={ 8 }>
						<Menu.Popup>
							<Menu.Group>
								<Menu.GroupLabel>Uncontrolled</Menu.GroupLabel>
								<Menu.RadioGroup defaultValue="two">
									<Menu.RadioItem value="one">
										<Menu.ItemLabel>
											Radio item 1
										</Menu.ItemLabel>
										<Menu.ItemHelpText>
											Initially unchecked
										</Menu.ItemHelpText>
									</Menu.RadioItem>
									<Menu.RadioItem value="two">
										<Menu.ItemLabel>
											Radio item 2
										</Menu.ItemLabel>
										<Menu.ItemHelpText>
											Initially checked
										</Menu.ItemHelpText>
									</Menu.RadioItem>
								</Menu.RadioGroup>
							</Menu.Group>

							<Menu.Separator />

							<Menu.Group>
								<Menu.GroupLabel>Controlled</Menu.GroupLabel>
								<Menu.RadioGroup
									value={ radioValue }
									onValueChange={ ( value ) =>
										setRadioValue( value as string )
									}
								>
									<Menu.RadioItem value="one">
										<Menu.ItemLabel>
											Radio item 1
										</Menu.ItemLabel>
										<Menu.ItemHelpText>
											Initially unchecked
										</Menu.ItemHelpText>
									</Menu.RadioItem>
									<Menu.RadioItem value="two">
										<Menu.ItemLabel>
											Radio item 2
										</Menu.ItemLabel>
										<Menu.ItemHelpText>
											Initially checked
										</Menu.ItemHelpText>
									</Menu.RadioItem>
								</Menu.RadioGroup>
							</Menu.Group>
						</Menu.Popup>
					</Menu.Positioner>
				</Menu.Portal>
			</Menu.Root>
		);
	},
};
