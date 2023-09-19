/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { menu } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DropdownMenu, DropdownMenuItem } from '..';
import Icon from '../../icon';
import Modal from '../../modal';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components (Experimental)/DropdownMenu v2 ariakit',
	component: DropdownMenu,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		DropdownMenuItem,
	},
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { excludeDecorators: true },
		},
	},
	decorators: [
		// Layout wrapper
		( Story ) => (
			<div
				style={ {
					minHeight: '300px',
				} }
			>
				<Story />
			</div>
		),
	],
};
export default meta;

const Template: StoryFn< typeof DropdownMenu > = ( props ) => (
	<DropdownMenu { ...props } />
);
export const Default = Template.bind( {} );
Default.args = {
	trigger: <Icon icon={ menu } size={ 24 } />,
	children: (
		<>
			<DropdownMenuItem>Undo</DropdownMenuItem>
			<DropdownMenuItem>Redo</DropdownMenuItem>
			<DropdownMenu trigger="Find">
				<DropdownMenuItem>Search the Web...</DropdownMenuItem>
				<DropdownMenuItem>Find...</DropdownMenuItem>
				<DropdownMenuItem>Find Next</DropdownMenuItem>
				<DropdownMenuItem>Find Previous</DropdownMenuItem>
			</DropdownMenu>
			<DropdownMenu trigger="Speech">
				<DropdownMenuItem>Start Speaking</DropdownMenuItem>
				<DropdownMenuItem disabled>Stop Speaking</DropdownMenuItem>
			</DropdownMenu>
		</>
	),
};

export const WithModal: StoryFn< typeof DropdownMenu > = ( props ) => {
	const [ isModalOpen, setModalOpen ] = useState( false );
	return (
		<>
			<DropdownMenu { ...props }>
				<DropdownMenuItem onClick={ () => setModalOpen( true ) }>
					Open modal
				</DropdownMenuItem>
				<DropdownMenuItem>Redo</DropdownMenuItem>
				<DropdownMenu trigger="Find">
					<DropdownMenuItem>Search the Web...</DropdownMenuItem>
					<DropdownMenuItem>Find...</DropdownMenuItem>
					<DropdownMenuItem>Find Next</DropdownMenuItem>
					<DropdownMenuItem>Find Previous</DropdownMenuItem>
				</DropdownMenu>
				<DropdownMenu trigger="Speech">
					<DropdownMenuItem>Start Speaking</DropdownMenuItem>
					<DropdownMenuItem disabled>Stop Speaking</DropdownMenuItem>
				</DropdownMenu>
			</DropdownMenu>
			{ isModalOpen && (
				<Modal onRequestClose={ () => setModalOpen( false ) }>
					Yo!
					<button onClick={ () => setModalOpen( false ) }>
						Close
					</button>
				</Modal>
			) }
		</>
	);
};
WithModal.args = {
	trigger: <Icon icon={ menu } size={ 24 } />,
};
