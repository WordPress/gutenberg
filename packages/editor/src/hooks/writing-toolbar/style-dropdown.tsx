import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import type { WritingStyle, WritingStyleGroup } from './types';

const POPOVER_PROPS = {
	className: 'editor-writing-toolbar__style-popover',
	placement: 'bottom-start' as const,
};

/**
 * Lists the text styles the theme offers, each shown in its own font and size
 * and gathered under the font it belongs to.
 *
 * @param props           Component props.
 * @param props.groups    The text styles, grouped by font.
 * @param props.activeKey The key of the style the block is in.
 * @param props.onSelect  Called with the style that was chosen.
 */
export default function WritingStyleDropdown( {
	groups,
	activeKey,
	onSelect,
}: {
	groups: WritingStyleGroup[];
	activeKey?: string;
	onSelect: ( style: WritingStyle ) => void;
} ) {
	const activeStyle = groups
		.flatMap( ( group ) => group.styles )
		.find( ( style ) => style.key === activeKey );

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="editor-writing-toolbar__style"
						icon={
							activeStyle ? (
								<BlockIcon
									icon={ activeStyle.icon }
									showColors
								/>
							) : null
						}
						label={ __( 'Style' ) }
						text={ activeStyle?.label ?? __( 'Style' ) }
						popoverProps={ POPOVER_PROPS }
						toggleProps={ toggleProps }
					>
						{ ( { onClose } ) => (
							<>
								{ groups.map( ( group, index ) => (
									<MenuGroup
										key={ group.fontFamily ?? index }
										label={ group.name }
									>
										{ group.styles.map( ( style ) => (
											<MenuItem
												key={ style.key }
												role="menuitemradio"
												isSelected={
													style.key === activeKey
												}
												disabled={ style.disabled }
												style={ {
													fontFamily:
														style.fontFamily,
													fontSize: style.fontSize,
												} }
												onClick={ () => {
													onSelect( style );
													onClose();
												} }
											>
												<BlockIcon
													icon={ style.icon }
													showColors
												/>
												{ style.label }
											</MenuItem>
										) ) }
									</MenuGroup>
								) ) }
							</>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
