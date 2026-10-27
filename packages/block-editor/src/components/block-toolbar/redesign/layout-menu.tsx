import {
	Button,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import type { IconType } from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
} from '@wordpress/ui';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { chevronDownSmall, plus, Icon } from '@wordpress/icons';
import Inserter from '../../inserter';
import useBlockDisplayInformation from '../../use-block-display-information';
import { store as blockEditorStore } from '../../../store';
import type { BlockOptionsMenuItemProps } from './options-menu-item';

function LayoutMenu( { items }: { items: BlockOptionsMenuItemProps[] } ) {
	return (
		<Menu.Root
			// Like the other toolbar dropdowns, the menu does not trap focus.
			modal={ false }
		>
			<ToolbarItem>
				{ ( toolbarItemProps ) => (
					<Menu.Trigger
						{ ...toolbarItemProps }
						render={
							<Button
								size="compact"
								className="block-editor-block-toolbar__text-menu-button"
							/>
						}
					>
						<span>{ _x( 'Layout', 'Block toolbar menu' ) }</span>
						<Icon
							className="block-editor-block-toolbar__block-name-chevron"
							icon={ chevronDownSmall }
							size={ 24 }
						/>
					</Menu.Trigger>
				) }
			</ToolbarItem>
			<Menu.Popup
				className="block-editor-block-toolbar__layout-menu"
				width="md"
				positioner={
					<Menu.Positioner
						className="block-editor-block-toolbar__menu-positioner"
						side="bottom"
						align="start"
					/>
				}
			>
				{ items.map( ( item, index ) => (
					<Fragment key={ item.name }>
						{ index > 0 && <Menu.Separator /> }
						<Menu.RadioGroup
							value={ item.value ?? null }
							onValueChange={ ( value ) =>
								item.onChange?.( value )
							}
						>
							<Menu.GroupLabel>{ item.label }</Menu.GroupLabel>
							{ item.choices?.map( ( choice ) => (
								<Menu.RadioItem
									key={ choice.value }
									value={ choice.value }
									prefix={
										choice.icon && (
											<Menu.PrefixIcon
												// The icons are drawn on a 24px grid.
												icon={ choice.icon as never }
												size={ 24 }
											/>
										)
									}
									suffix={ choice.info }
								>
									<Menu.ItemLabel>
										{ choice.label }
									</Menu.ItemLabel>
								</Menu.RadioItem>
							) ) }
						</Menu.RadioGroup>
					</Fragment>
				) ) }
			</Menu.Popup>
		</Menu.Root>
	);
}

/**
 * Adds a block inside a container, as its last child.
 *
 * @param props          Component props.
 * @param props.clientId The client ID of the container.
 */
function ContainerInserter( { clientId }: { clientId: string } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	return (
		<Inserter
			position="bottom right"
			rootClientId={ clientId }
			isAppender
			__experimentalIsQuick
			renderToggle={ ( {
				onToggle,
				isOpen,
				disabled,
				blockTitle,
				hasSingleBlockType,
			} ) => (
				<ToolbarButton
					className="block-editor-block-toolbar__container-inserter"
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ disabled }
					label={
						hasSingleBlockType
							? sprintf(
									// translators: 1: the name of the only block that can be added. 2: the name of the container block, e.g. "Group".
									__( 'Add %1$s to %2$s' ),
									blockTitle.toLowerCase(),
									blockInformation?.title as string
								)
							: sprintf(
									// translators: %s: the name of the container block, e.g. "Group".
									__( 'Add block to %s' ),
									blockInformation?.title as string
								)
					}
					showTooltip
					icon={ plus as IconType }
				/>
			) }
		/>
	);
}

/**
 * The primary actions of container blocks in the redesigned toolbar: the
 * Layout menu, grouping the container's width and layout settings, and an
 * inserter that adds a block inside it.
 *
 * @param props          Component props.
 * @param props.clientId The client ID of the container.
 * @param props.items    The items added through the slot.
 */
export default function ContainerActions( {
	clientId,
	items,
}: {
	clientId: string;
	items: BlockOptionsMenuItemProps[];
} ) {
	const layoutItems = items.filter(
		( item ) => item.group === 'layout' && !! item.choices?.length
	);
	const showInserter = useSelect(
		( select ) => {
			const {
				getTemplateLock,
				getBlockEditingMode,
				hasInserterItems,
				getBlockListSettings,
				getBlockName,
			} = select( blockEditorStore );
			const blockName = getBlockName( clientId ) ?? '';
			const templateLock = getTemplateLock( clientId );
			return (
				// Containers are the blocks that lay out their inner blocks.
				( hasBlockSupport( blockName, 'layout' ) ||
					hasBlockSupport( blockName, '__experimentalLayout' ) ) &&
				// Only blocks with inner blocks have list settings.
				!! getBlockListSettings( clientId ) &&
				getBlockEditingMode( clientId ) === 'default' &&
				templateLock !== 'all' &&
				templateLock !== 'contentOnly' &&
				hasInserterItems( clientId )
			);
		},
		[ clientId ]
	);

	if ( ! layoutItems.length && ! showInserter ) {
		return null;
	}

	return (
		<ToolbarGroup className="block-editor-block-toolbar__container-actions">
			{ !! layoutItems.length && <LayoutMenu items={ layoutItems } /> }
			{ showInserter && <ContainerInserter clientId={ clientId } /> }
		</ToolbarGroup>
	);
}
