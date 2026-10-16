import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '@wordpress/blocks';
import { Button, TextControl } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import BlockEdit, { useBlockEditContext } from '../';
import { useBlockProps } from '../../block-list/use-block-props';
import { ExperimentalBlockEditorProvider } from '../../provider';

const TEXT_BLOCK = 'storybook/example-text';
const HEADING_BLOCK = 'storybook/example-heading';

const CLIENT_ID = 'example-block';

type ExampleAttributes = { content?: string };

type ExampleEditProps = {
	attributes: ExampleAttributes;
	setAttributes: ( attributes: ExampleAttributes ) => void;
	isSelectionEnabled?: boolean;
	onReplace?: ( blocks: object[] ) => void;
	onRemove?: () => void;
};

type BlockEditContext = {
	name: string;
	clientId: string;
	isSelected: boolean;
};

function ExampleEdit( {
	attributes,
	setAttributes,
	isSelectionEnabled,
	onReplace,
	onRemove,
}: ExampleEditProps ) {
	const { name, clientId, isSelected } =
		useBlockEditContext() as BlockEditContext;
	const blockProps = useBlockProps();
	const Tag = name === HEADING_BLOCK ? 'h3' : 'p';

	return (
		<div { ...blockProps }>
			<Tag>{ attributes.content }</Tag>
			<TextControl
				label={ __( 'Content' ) }
				help={ __(
					'Editing the content calls the `setAttributes` prop passed to the block.'
				) }
				value={ attributes.content ?? '' }
				onChange={ ( content ) => setAttributes( { content } ) }
			/>
			<ul>
				<li>
					{ __( 'Block type:' ) } <code>{ name }</code>
				</li>
				<li>
					{ __( 'Client ID:' ) } <code>{ clientId }</code>
				</li>
				<li>
					{ __( 'Selected:' ) } <code>{ String( isSelected ) }</code>
				</li>
				<li>
					{ __( 'Selection enabled:' ) }{ ' ' }
					<code>{ String( !! isSelectionEnabled ) }</code>
				</li>
			</ul>
			<Stack direction="row" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () =>
						onReplace?.( [
							createBlock( TEXT_BLOCK, {
								content: 'A replacement block.',
							} ),
						] )
					}
				>
					{ __( 'Replace block' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => onRemove?.() }
				>
					{ __( 'Remove block' ) }
				</Button>
			</Stack>
		</div>
	);
}

function useExampleBlocks() {
	return useMemo( () => {
		[
			[ TEXT_BLOCK, 'Example Text' ],
			[ HEADING_BLOCK, 'Example Heading' ],
		].forEach( ( [ name, title ] ) => {
			if ( ! getBlockType( name ) ) {
				registerBlockType( name, {
					apiVersion: 3,
					title,
					category: 'text',
					attributes: { content: { type: 'string' } },
					edit: ExampleEdit,
					save: () => null,
				} );
			}
		} );

		return [ { ...createBlock( TEXT_BLOCK ), clientId: CLIENT_ID } ];
	}, [] );
}

const sourceCode = `<BlockEdit
	name="storybook/example-text"
	clientId={ clientId }
	isSelected={ isSelected }
	attributes={ attributes }
	setAttributes={ setAttributes }
	onReplace={ onReplace }
/>`;

const meta: Meta< typeof BlockEdit > = {
	title: 'BlockEditor/BlockEdit',
	component: BlockEdit,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'BlockEdit renders the `edit` implementation of the block type matching `name`, and passes the props it receives on to it. It also provides the block edit context, the `name`, `clientId` and `isSelected` state of the block to everything rendered underneath, which is what `useBlockEditContext` and the block controls slots read. Nothing is rendered when no block type is registered under `name`.',
			},
			source: { code: sourceCode },
		},
	},
	argTypes: {
		name: {
			control: { type: 'select' },
			options: [ TEXT_BLOCK, HEADING_BLOCK ],
			description:
				'The name of the block type to render the `edit` implementation of.',
			table: {
				type: { summary: 'string' },
			},
		},
		clientId: {
			control: { type: 'text' },
			description: 'The client ID of the block being edited.',
			table: {
				type: { summary: 'string' },
			},
		},
		isSelected: {
			control: { type: 'boolean' },
			description:
				'Whether the block is selected. Blocks and the block controls slots read it from the block edit context.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		attributes: {
			control: { type: 'object' },
			description: 'The attributes of the block.',
			table: {
				type: { summary: 'Object' },
				defaultValue: { summary: '{}' },
			},
		},
		setAttributes: {
			action: 'setAttributes',
			control: false,
			description:
				'Function called by the block to update its own attributes.',
			table: {
				type: { summary: 'Function' },
			},
		},
		onReplace: {
			action: 'onReplace',
			control: false,
			description:
				'Function called by the block to replace itself with the given blocks.',
			table: {
				type: { summary: 'Function' },
			},
		},
		onRemove: {
			action: 'onRemove',
			control: false,
			description: 'Function called by the block to remove itself.',
			table: {
				type: { summary: 'Function' },
			},
		},
		mergeBlocks: {
			action: 'mergeBlocks',
			control: false,
			description:
				'Function called by the block to merge itself with an adjacent block, for example when backspacing at the start of its content.',
			table: {
				type: { summary: 'Function' },
			},
		},
		insertBlocksAfter: {
			action: 'insertBlocksAfter',
			control: false,
			description:
				'Function called by the block to insert the given blocks after itself, for example when splitting its content.',
			table: {
				type: { summary: 'Function' },
			},
		},
		isSelectionEnabled: {
			control: { type: 'boolean' },
			description:
				'Whether the block content can be selected, which blocks handling their own selection read.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		toggleSelection: {
			action: 'toggleSelection',
			control: false,
			description:
				'Function called by the block to enable or disable block selection, so that a drag interaction of its own is not treated as a text selection.',
			table: {
				type: { summary: 'Function' },
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof BlockEdit >;

export const Default: Story = {
	render: function Template( {
		attributes: attributesArg,
		setAttributes,
		...args
	} ) {
		const blocks = useExampleBlocks();
		const [ attributes, setStoryAttributes ] =
			useState< ExampleAttributes >( attributesArg );

		// Keeps the rendered block in sync with the attributes control.
		useEffect(
			() => setStoryAttributes( attributesArg ),
			[ attributesArg ]
		);

		return (
			<ExperimentalBlockEditorProvider value={ blocks }>
				<BlockEdit
					{ ...args }
					attributes={ attributes }
					setAttributes={ ( nextAttributes: ExampleAttributes ) => {
						setStoryAttributes( ( currentAttributes ) => ( {
							...currentAttributes,
							...nextAttributes,
						} ) );
						setAttributes( nextAttributes );
					} }
				/>
			</ExperimentalBlockEditorProvider>
		);
	},
	args: {
		name: TEXT_BLOCK,
		clientId: CLIENT_ID,
		isSelected: true,
		isSelectionEnabled: true,
		attributes: { content: 'An example block rendered by BlockEdit.' },
	},
};
