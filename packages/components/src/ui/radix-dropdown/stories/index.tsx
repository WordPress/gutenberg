/**
 * External dependencies
 */
import type { ComponentMeta } from '@storybook/react';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import * as DropdownMenu from '../';
import { useCx } from '../../../utils/hooks/use-cx';

// TODO: replace with wordpress/icons
import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const meta: ComponentMeta< typeof DropdownMenu.Root > = {
	title: 'Components/RadixDropdown',
	component: DropdownMenu.Root,
	// subcomponents: { DropdownMenu. },
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
		controls: {
			expanded: true,
		},
	},
};
export default meta;

const iconButton = css`
	font-family: inherit;
	border-radius: 100%;
	height: 35px;
	width: 35px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: hsl( 250, 95%, 76.8% ); // violet11
	background-color: white;
	box-shadow: 0 2px 10px hsla( 0, 0%, 0%, 0.141 ); //blackA7

	&:hover {
		background-color: hsl( 253, 37%, 18.4% ); // violet3
	}

	&:focus {
		box-shadow: 0 0 0 2px black;
	}
`;

const rightSlot = css`
	margin-left: auto;
	padding-left: 20px;
	color: hsl( 253, 4%, 63.7% ); // mauve11

	[data-highlighted] > & {
		color: white;
	}

	[data-disabled] & {
		color: hsl( 253, 4%, 63.7% ); // mauve8
	}
`;

export const DropdownMenuDemo = () => {
	const [ bookmarksChecked, setBookmarksChecked ] = useState( true );
	const [ urlsChecked, setUrlsChecked ] = useState( false );
	const [ person, setPerson ] = useState( 'pedro' );

	const cx = useCx();

	const rightSlotClassName = cx( rightSlot );

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button
					className={ cx( iconButton ) }
					aria-label="Customise options"
				>
					<HamburgerMenuIcon />
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content sideOffset={ 5 }>
					<DropdownMenu.Item>
						New Tab <div className={ rightSlotClassName }>⌘+T</div>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						New Window{ ' ' }
						<div className={ rightSlotClassName }>⌘+N</div>
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled>
						New Private Window{ ' ' }
						<div className={ rightSlotClassName }>⇧+⌘+N</div>
					</DropdownMenu.Item>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							More Tools
							<div className={ rightSlotClassName }>
								<ChevronRightIcon />
							</div>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.Portal>
							<DropdownMenu.SubContent
								sideOffset={ 2 }
								alignOffset={ -5 }
							>
								<DropdownMenu.Item>
									Save Page As…{ ' ' }
									<div className={ rightSlotClassName }>
										⌘+S
									</div>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									Create Shortcut…
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									Name Window…
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									Developer Tools
								</DropdownMenu.Item>
							</DropdownMenu.SubContent>
						</DropdownMenu.Portal>
					</DropdownMenu.Sub>

					<DropdownMenu.Separator />

					<DropdownMenu.CheckboxItem
						checked={ bookmarksChecked }
						onCheckedChange={ setBookmarksChecked }
					>
						<DropdownMenu.ItemIndicator>
							<CheckIcon />
						</DropdownMenu.ItemIndicator>
						Show Bookmarks{ ' ' }
						<div className={ rightSlotClassName }>⌘+B</div>
					</DropdownMenu.CheckboxItem>
					<DropdownMenu.CheckboxItem
						className="DropdownMenuCheckboxItem"
						checked={ urlsChecked }
						onCheckedChange={ setUrlsChecked }
					>
						<DropdownMenu.ItemIndicator>
							<CheckIcon />
						</DropdownMenu.ItemIndicator>
						Show Full URLs
					</DropdownMenu.CheckboxItem>

					<DropdownMenu.Separator />

					<DropdownMenu.Label>People</DropdownMenu.Label>
					<DropdownMenu.RadioGroup
						value={ person }
						onValueChange={ setPerson }
					>
						<DropdownMenu.RadioItem value="pedro">
							<DropdownMenu.ItemIndicator>
								<DotFilledIcon />
							</DropdownMenu.ItemIndicator>
							Pedro Duarte
						</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem
							className="DropdownMenuRadioItem"
							value="colm"
						>
							<DropdownMenu.ItemIndicator>
								<DotFilledIcon />
							</DropdownMenu.ItemIndicator>
							Colm Tuite
						</DropdownMenu.RadioItem>
					</DropdownMenu.RadioGroup>

					<DropdownMenu.Arrow />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};
