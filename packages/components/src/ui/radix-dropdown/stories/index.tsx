/**
 * External dependencies
 */
import type { ComponentMeta } from '@storybook/react';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS } from '../../../utils';
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownSubMenu,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from '../';
import { useCx } from '../../../utils/hooks/use-cx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { chevronRightSmall, menu, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../../../icon';

const meta: ComponentMeta< typeof DropdownMenu > = {
	title: 'Components/RadixDropdown',
	component: DropdownMenu,
	subcomponents: { DropdownMenuItem },
	argTypes: {
		// focusOnMount: {
		// 	options: [ 'firstElement', true, false ],
		// 	control: {
		// 		type: 'radio',
		// 	},
		// },
		// position: { control: { type: null } },
		// renderContent: { control: { type: null } },
		// renderToggle: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open', excludeDecorators: true } },
	},
};
export default meta;

const iconButton = css`
	all: unset;
	font-family: inherit;
	border-radius: 100%;
	height: 35px;
	width: 35px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${ COLORS.gray[ 900 ] };
	background-color: white;
	box-shadow: 0 2px 10px hsla( 0, 0%, 0%, 0.141 );

	&:hover,
	&:focus {
		color: ${ COLORS.ui.theme };
	}

	&:focus {
		box-shadow: 0 0 0 2px ${ COLORS.ui.theme };
	}

	svg {
		fill: currentColor;
	}
`;

const rightSlot = css`
	margin-left: auto;
	padding-left: 24px;
`;

export const DropdownMenuDemo = () => {
	const [ bookmarksChecked, setBookmarksChecked ] = useState( true );
	const [ urlsChecked, setUrlsChecked ] = useState( false );
	const [ person, setPerson ] = useState( 'pedro' );

	const cx = useCx();

	const rightSlotClassName = cx( rightSlot );

	return (
		<DropdownMenu
			trigger={
				<button
					className={ cx( iconButton ) }
					aria-label="Customise options"
				>
					<Icon icon={ menu } size={ 20 } />
				</button>
			}
			contentProps={ { sideOffset: 5 } }
		>
			<DropdownMenuGroup>
				<DropdownMenuItem icon={ wordpress }>
					New Tab <div className={ rightSlotClassName }>⌘+T</div>
				</DropdownMenuItem>
				<DropdownMenuItem>
					New Window <div className={ rightSlotClassName }>⌘+N</div>
				</DropdownMenuItem>
				<DropdownMenuItem disabled>
					New Private Window{ ' ' }
					<div className={ rightSlotClassName }>⇧+⌘+N</div>
				</DropdownMenuItem>

				<DropdownSubMenu
					trigger={
						<>
							More Tools
							<div className={ rightSlotClassName }>
								<Icon icon={ chevronRightSmall } size={ 28 } />
							</div>
						</>
					}
					subContentProps={ {
						sideOffset: 2,
						alignOffset: -5,
					} }
				>
					<DropdownMenuItem>
						Save Page As…{ ' ' }
						<div className={ rightSlotClassName }>⌘+S</div>
					</DropdownMenuItem>
					<DropdownMenuItem>Create Shortcut…</DropdownMenuItem>
					<DropdownMenuItem>Name Window…</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>Developer Tools</DropdownMenuItem>
				</DropdownSubMenu>

				<DropdownMenuSeparator />
			</DropdownMenuGroup>

			<DropdownMenuGroup>
				<DropdownMenuCheckboxItem
					checked={ bookmarksChecked }
					onCheckedChange={ setBookmarksChecked }
				>
					Show Bookmarks{ ' ' }
					<div className={ rightSlotClassName }>⌘+B</div>
				</DropdownMenuCheckboxItem>

				<DropdownMenuCheckboxItem
					checked={ urlsChecked }
					onCheckedChange={ setUrlsChecked }
				>
					Show Full URLs
				</DropdownMenuCheckboxItem>

				<DropdownMenuSeparator />
			</DropdownMenuGroup>

			<DropdownMenuRadioGroup
				value={ person }
				onValueChange={ setPerson }
			>
				<DropdownMenuLabel>People</DropdownMenuLabel>
				<DropdownMenuRadioItem value="pedro">
					Pedro Duarte
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem
					className="DropdownMenuRadioItem"
					value="colm"
				>
					Colm Tuite
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</DropdownMenu>
	);
};
