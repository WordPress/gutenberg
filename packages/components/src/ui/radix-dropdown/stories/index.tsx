/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import styled from '@emotion/styled';

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

/**
 * WordPress dependencies
 */
import { useState, createContext, useContext } from '@wordpress/element';
import { chevronRightSmall, menu, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../../../icon';

const DropdownMenuStoryContext = createContext< {
	bookmarksChecked?: boolean;
	setBookmarksChecked?: ( v: boolean ) => void;
	urlsChecked?: boolean;
	setUrlsChecked?: ( v: boolean ) => void;
	person?: string;
	setPerson?: ( v: string ) => void;
} >( {} );

const meta: ComponentMeta< typeof DropdownMenu > = {
	title: 'Components/Radix DropdownMenu',
	component: DropdownMenu,
	subcomponents: {
		DropdownMenuItem,
		DropdownSubMenu,
		DropdownMenuSeparator,
		DropdownMenuCheckboxItem,
		DropdownMenuGroup,
		DropdownMenuLabel,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	},
	argTypes: {
		children: { control: { type: null } },
		trigger: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open', excludeDecorators: true } },
	},
	decorators: [
		( Story ) => {
			const [ bookmarksChecked, setBookmarksChecked ] = useState( true );
			const [ urlsChecked, setUrlsChecked ] = useState( false );
			const [ person, setPerson ] = useState( 'pedro' );

			return (
				<DropdownMenuStoryContext.Provider
					value={ {
						bookmarksChecked,
						setBookmarksChecked,
						urlsChecked,
						setUrlsChecked,
						person,
						setPerson,
					} }
				>
					<Story />
				</DropdownMenuStoryContext.Provider>
			);
		},
	],
};
export default meta;

const MenuButton = styled.div`
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

const KeyboardShortcut = styled.span`
	opacity: 0.8;
`;

const CheckboxItemsGroup = () => {
	const {
		bookmarksChecked,
		setBookmarksChecked,
		urlsChecked,
		setUrlsChecked,
	} = useContext( DropdownMenuStoryContext );

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Options</DropdownMenuLabel>
			<DropdownMenuCheckboxItem
				checked={ bookmarksChecked }
				onCheckedChange={ setBookmarksChecked }
				suffix={ <KeyboardShortcut>⌘+B</KeyboardShortcut> }
			>
				Show Bookmarks
			</DropdownMenuCheckboxItem>

			<DropdownMenuCheckboxItem
				checked={ urlsChecked }
				onCheckedChange={ setUrlsChecked }
			>
				Show Full URLs
			</DropdownMenuCheckboxItem>

			<DropdownMenuSeparator />
		</DropdownMenuGroup>
	);
};

const RadioItemsGroup = () => {
	const { person, setPerson } = useContext( DropdownMenuStoryContext );

	return (
		<DropdownMenuRadioGroup value={ person } onValueChange={ setPerson }>
			<DropdownMenuLabel>People</DropdownMenuLabel>
			<DropdownMenuRadioItem value="pedro">
				Pedro Duarte
			</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="colm">
				Colm Tuite
			</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup>
	);
};

const Template: ComponentStory< typeof DropdownMenu > = ( props ) => (
	<div
		style={ {
			width: '100%',
			minHeight: '300px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		} }
	>
		<DropdownMenu { ...props } />
	</div>
);
export const Default = Template.bind( {} );
Default.args = {
	trigger: (
		<MenuButton aria-label="Customize options">
			<Icon icon={ menu } size={ 20 } />
		</MenuButton>
	),
	sideOffset: 12,
	children: (
		<>
			<DropdownMenuGroup>
				<DropdownMenuItem
					prefix={ <Icon icon={ wordpress } size={ 18 } /> }
					suffix={ <KeyboardShortcut>⌘+T</KeyboardShortcut> }
				>
					New Tab
				</DropdownMenuItem>
				<DropdownMenuItem
					suffix={ <KeyboardShortcut>⌘+N</KeyboardShortcut> }
				>
					New Window
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled
					suffix={ <KeyboardShortcut>⇧+⌘+N</KeyboardShortcut> }
				>
					New Private Window
				</DropdownMenuItem>
				<DropdownSubMenu
					trigger={
						<DropdownMenuItem
							suffix={
								<Icon icon={ chevronRightSmall } size={ 28 } />
							}
						>
							More Tools
						</DropdownMenuItem>
					}
				>
					<DropdownMenuItem
						suffix={ <KeyboardShortcut>⌘+S</KeyboardShortcut> }
					>
						Save Page As…
					</DropdownMenuItem>
					<DropdownMenuItem>Create Shortcut…</DropdownMenuItem>
					<DropdownMenuItem>Name Window…</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>Developer Tools</DropdownMenuItem>
				</DropdownSubMenu>
				<DropdownMenuSeparator />
			</DropdownMenuGroup>

			<CheckboxItemsGroup />

			<RadioItemsGroup />
		</>
	),
};
