import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { formatBold, formatItalic, link } from '@wordpress/icons';
import NavigableToolbar from '../';
import BlockList from '../../block-list';
import { useBlockProps } from '../../block-list/use-block-props';
import BlockEditorKeyboardShortcuts from '../../keyboard-shortcuts';
import { ExperimentalBlockEditorProvider } from '../../provider';
import WritingFlow from '../../writing-flow';

// A minimal block type, so that the story doesn't depend on the block library.
const BLOCK_NAME = 'storybook/example';
const BLOCK_LABELS = [ 'First', 'Second' ];

function ExampleBlockEdit( {
	attributes,
}: {
	attributes: { content: string };
} ) {
	return <p { ...useBlockProps() }>{ attributes.content }</p>;
}

// Registered when the story renders rather than when this file loads, so that
// the example block type doesn't leak into the registry shared with the other
// stories.
function useExampleBlocks() {
	return useMemo( () => {
		if ( ! getBlockType( BLOCK_NAME ) ) {
			registerBlockType( BLOCK_NAME, {
				apiVersion: 3,
				title: 'Example',
				category: 'text',
				attributes: {
					content: { type: 'string' },
				},
				edit: ExampleBlockEdit,
				save: () => null,
			} );
		}

		return BLOCK_LABELS.map( ( label ) =>
			createBlock( BLOCK_NAME, {
				content: `${ label } example block.`,
			} )
		);
	}, [] );
}

// Separates the toolbar from the block list, so that it is easier to see where
// focus is as it moves between the two.
const storyStyles = `
	.navigable-toolbar-story .block-editor-block-list__block {
		border: 1px dashed #949494;
		padding: 8px;
		margin-bottom: 16px;
	}
	.navigable-toolbar-story .components-accessible-toolbar {
		display: inline-flex;
		border: 1px solid #1e1e1e;
	}
`;

const meta: Meta< typeof NavigableToolbar > = {
	title: 'BlockEditor/NavigableToolbar',
	component: NavigableToolbar,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A toolbar whose controls are reached with the arrow keys rather than the tab key, so that the whole toolbar is a single tab stop. When every child is a `ToolbarItem`-derived component it renders the accessible `Toolbar` from `@wordpress/components`; otherwise it falls back to a deprecated `NavigableMenu` implementation. The keyboard shortcut and the escape behavior both read from the block editor store, so the toolbar is rendered next to a block list here.',
			},
		},
	},
	decorators: [
		( Story ) => {
			const blocks = useExampleBlocks();

			return (
				<ExperimentalBlockEditorProvider value={ blocks }>
					{ /* Registers Alt+F10, which the toolbar listens for. */ }
					<BlockEditorKeyboardShortcuts.Register />
					<style>{ storyStyles }</style>
					<div className="navigable-toolbar-story">
						<WritingFlow>
							<BlockList />
						</WritingFlow>
						<Story />
					</div>
				</ExperimentalBlockEditorProvider>
			);
		},
	],
	argTypes: {
		'aria-label': {
			control: { type: 'text' },
			description:
				'Accessibility label for the toolbar, passed to the underlying `Toolbar` as its label.',
			table: {
				type: { summary: 'string' },
			},
		},
		orientation: {
			control: { type: 'select' },
			options: [ 'horizontal', 'vertical' ],
			description:
				'The direction the arrow keys move through the toolbar items.',
			table: {
				type: { summary: "'horizontal' | 'vertical'" },
				defaultValue: { summary: "'horizontal'" },
			},
		},
		shouldUseKeyboardFocusShortcut: {
			control: { type: 'boolean' },
			description:
				'Whether pressing Alt+F10 moves focus to the first item of the toolbar.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'true' },
			},
		},
		focusEditorOnEscape: {
			control: { type: 'boolean' },
			description:
				'Whether pressing Escape inside the toolbar returns focus to the element that last had it in the editor canvas.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		children: {
			description:
				'The toolbar controls. Use `ToolbarItem`-derived components such as `ToolbarButton` or `ToolbarDropdownMenu`; anything else opts the toolbar into the deprecated implementation.',
			table: {
				type: { summary: 'ReactNode' },
			},
			control: false,
		},
		__experimentalInitialIndex: {
			description:
				'The index of the toolbar item to focus when the toolbar mounts with focus already inside it.',
			table: {
				type: { summary: 'number' },
			},
			control: false,
		},
		__experimentalOnIndexChange: {
			action: '__experimentalOnIndexChange',
			description:
				'Called when the toolbar unmounts with the index of the item that had focus, so it can be restored by a later mount.',
			table: {
				type: { summary: 'function' },
			},
			control: false,
		},
	},
	args: {
		'aria-label': 'Block tools',
	},
};

export default meta;

export const Default: StoryObj< typeof NavigableToolbar > = {
	render: function Template( args ) {
		return (
			<NavigableToolbar { ...args }>
				<ToolbarButton icon={ formatBold } label="Bold" />
				<ToolbarButton icon={ formatItalic } label="Italic" />
				<ToolbarButton icon={ link } label="Link" />
			</NavigableToolbar>
		);
	},
};
