/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	Button,
	FlexItem,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import {
	plus,
	Icon,
	chevronLeft,
	chevronRight,
	moreVertical,
} from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { Subtitle } from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';
import { unlock } from '../lock-unlock';
import ConfirmResetDialog from './dialogs/confirm-reset-dialog';

const { Menu } = unlock( componentsPrivateApis );

interface PresetGroupItem {
	name: string;
	slug: string;
}

interface MenuActionConfig {
	label: string;
	optionsLabel: string;
	confirmText: string;
	confirmButtonText: string;
	onConfirm: () => void;
}

interface PresetGroupProps {
	label: string;
	items: PresetGroupItem[];
	getEditPath: ( slug: string ) => string;
	addLabel?: string;
	onAdd?: () => void;
	menuAction?: MenuActionConfig;
}

export default function PresetGroup( {
	label,
	items,
	getEditPath,
	addLabel,
	onAdd,
	menuAction,
}: PresetGroupProps ) {
	const [ isResetOpen, setIsResetOpen ] = useState( false );
	const showMenu = !! menuAction && items.length > 0;

	return (
		<Stack direction="column" gap="sm">
			{ menuAction && isResetOpen && (
				<ConfirmResetDialog
					text={ menuAction.confirmText }
					confirmButtonText={ menuAction.confirmButtonText }
					isOpen={ isResetOpen }
					toggleOpen={ () => setIsResetOpen( false ) }
					onConfirm={ menuAction.onConfirm }
				/>
			) }
			<Stack justify="space-between" align="flex-start">
				<Subtitle level={ 3 }>{ label }</Subtitle>
				<FlexItem>
					{ addLabel && onAdd && (
						<Button
							size="small"
							icon={ plus }
							label={ addLabel }
							onClick={ onAdd }
						/>
					) }
					{ showMenu && (
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										size="small"
										icon={ moreVertical }
										label={ menuAction.optionsLabel }
									/>
								}
							/>
							<Menu.Popover>
								<Menu.Item
									onClick={ () => setIsResetOpen( true ) }
								>
									<Menu.ItemLabel>
										{ menuAction.label }
									</Menu.ItemLabel>
								</Menu.Item>
							</Menu.Popover>
						</Menu>
					) }
				</FlexItem>
			</Stack>
			{ items.length > 0 && (
				<ItemGroup isBordered isSeparated>
					{ items.map( ( item ) => (
						<NavigationButtonAsItem
							key={ item.slug }
							path={ getEditPath( item.slug ) }
						>
							<Stack
								direction="row"
								justify="space-between"
								align="center"
							>
								<FlexItem>{ item.name }</FlexItem>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</Stack>
						</NavigationButtonAsItem>
					) ) }
				</ItemGroup>
			) }
		</Stack>
	);
}
