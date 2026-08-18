import {
	createBlock,
	getBlockType,
	registerBlockType,
} from '@wordpress/blocks';
import { createContext, useContext, useMemo } from '@wordpress/element';
import InnerBlocks from '../';
import BlockList from '../../block-list';
import { useBlockProps } from '../../block-list/use-block-props';
import { ExperimentalBlockEditorProvider } from '../../provider';

// `InnerBlocks` only renders within a block, so the story args are passed down
// to the block type registered below through a context rather than rendered by
// the story directly.
const ArgsContext = createContext( {} );

const CONTAINER_BLOCK = 'storybook/inner-blocks-container';
const TEXT_BLOCK = 'storybook/example-text';
const MEDIA_BLOCK = 'storybook/example-media';
const CHILD_BLOCKS = [
	[ TEXT_BLOCK, 'Example Text', 'text' ],
	[ MEDIA_BLOCK, 'Example Media', 'media' ],
];

// The inner blocks appender is only rendered while the block holding the inner
// blocks is selected, so the container is selected from the start and its
// client ID is hardcoded instead of using the generated one.
const CONTAINER_CLIENT_ID = 'inner-blocks-container';
const SELECTION = {
	selectionStart: { clientId: CONTAINER_CLIENT_ID },
	selectionEnd: { clientId: CONTAINER_CLIENT_ID },
};

function ContainerEdit() {
	const args = useContext( ArgsContext );
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<InnerBlocks { ...args } />
		</div>
	);
}

function ChildEdit( { name } ) {
	const blockProps = useBlockProps();
	const { title } = getBlockType( name );

	return <p { ...blockProps }>{ title }</p>;
}

// Minimal block types, so that the story doesn't depend on the block library.
// They are registered when the story renders rather than when this file loads,
// so that they don't leak into the registry shared with the other stories.
function useContainerBlock() {
	return useMemo( () => {
		CHILD_BLOCKS.forEach( ( [ name, title, category ] ) => {
			if ( ! getBlockType( name ) ) {
				registerBlockType( name, {
					apiVersion: 3,
					title,
					category,
					edit: ChildEdit,
					save: () => null,
				} );
			}
		} );

		if ( ! getBlockType( CONTAINER_BLOCK ) ) {
			registerBlockType( CONTAINER_BLOCK, {
				apiVersion: 3,
				title: 'Example Container',
				category: 'design',
				// The container is only meant to host the inner blocks area,
				// so it is kept out of the inserter itself.
				supports: { inserter: false },
				edit: ContainerEdit,
				save: () => null,
			} );
		}

		return [
			{
				...createBlock( CONTAINER_BLOCK ),
				clientId: CONTAINER_CLIENT_ID,
			},
		];
	}, [] );
}

// Marks out the inner blocks area, so that it is easier to tell which part of
// the block list the props apply to.
const storyStyles = `
	.inner-blocks-story .wp-block[data-type="${ CONTAINER_BLOCK }"] {
		border: 1px dashed #949494;
		padding: 16px;
	}
`;

// The rendered story is a block editor hosting the example block below, so the
// generated snippet would only show that scaffolding. This is how a block
// renders the inner blocks area that the controls act on instead.
const sourceCode = `registerBlockType( 'my-plugin/my-block', {
	edit() {
		const blockProps = useBlockProps();

		return (
			<div { ...blockProps }>
				<InnerBlocks
					allowedBlocks={ [ 'core/image', 'core/paragraph' ] }
					orientation="vertical"
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</div>
		);
	},

	save() {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
} );`;

const meta = {
	title: 'BlockEditor/InnerBlocks',
	component: InnerBlocks,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'InnerBlocks is a component which allows a single block to have multiple blocks as children. It is rendered by a block `edit` implementation, and pairs with `InnerBlocks.Content` in the `save` implementation, which is replaced by the content of the nested blocks.',
			},
			source: { code: sourceCode },
		},
	},
	argTypes: {
		allowedBlocks: {
			control: { type: 'select' },
			options: [ 'all', 'none', 'text block only' ],
			mapping: {
				all: true,
				none: false,
				'text block only': [ TEXT_BLOCK ],
			},
			description:
				'The block types that can be inserted. `true` allows every block type, `false` allows none, and an array limits insertion to the listed block types.',
			table: {
				type: { summary: 'boolean | string[]' },
				defaultValue: { summary: 'true' },
			},
		},
		orientation: {
			control: { type: 'select' },
			options: [ 'vertical', 'horizontal' ],
			description:
				'Whether inner blocks are shown horizontally or vertically. It does not style the inner blocks, but it orients the block movers and makes drag and drop behave accordingly.',
			table: {
				type: { summary: "'horizontal' | 'vertical'" },
				defaultValue: { summary: "'vertical'" },
			},
		},
		templateLock: {
			control: { type: 'select' },
			options: [ false, 'all', 'insert', 'contentOnly' ],
			description:
				"Locks the inner blocks area. `'all'` prevents all operations, `'insert'` prevents inserting and removing blocks but allows moving them, `'contentOnly'` prevents all operations and cannot be overridden by children, and `false` opts out of a lock applied by a parent. When unset, the lock of the parent inner blocks area is used.",
			table: {
				type: { summary: "boolean | 'all' | 'insert' | 'contentOnly'" },
			},
		},
		renderAppender: {
			control: { type: 'select' },
			options: [ 'default', 'button', 'none' ],
			mapping: {
				default: undefined,
				button: InnerBlocks.ButtonBlockAppender,
				none: false,
			},
			description:
				'The component shown as the trailing appender of the inner blocks list. `InnerBlocks.ButtonBlockAppender` and `InnerBlocks.DefaultBlockAppender` are exposed for convenience, and any valid component can be passed. `false` renders no appender, and when unset the default appender is shown.',
			table: {
				type: { summary: 'Component | false' },
			},
		},
		defaultBlock: {
			control: { type: 'object' },
			description:
				'The block type inserted by default, in the form `{ name, attributes }`.',
			table: {
				type: { summary: 'Object' },
			},
		},
		directInsert: {
			control: { type: 'boolean' },
			description:
				'Whether the appender inserts `defaultBlock` directly, skipping the inserter dropdown and any registered inserter variations of that block type.',
			table: {
				type: { summary: 'boolean' },
			},
		},
		prioritizedInserterBlocks: {
			control: { type: 'object' },
			description:
				'The block types shown first in the block inserter, as an array of `{blockName}/{variationName}` strings, where the variation name is optional.',
			table: {
				type: { summary: 'string[]' },
			},
		},
		placeholder: {
			control: false,
			description:
				'An element rendered in front of the appender, which can be used to represent an example state before any block is inserted.',
			table: {
				type: { summary: 'Element' },
			},
		},
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		const blocks = useContainerBlock();

		return (
			<ArgsContext.Provider value={ args }>
				<ExperimentalBlockEditorProvider
					value={ blocks }
					selection={ SELECTION }
				>
					<style>{ storyStyles }</style>
					<div className="inner-blocks-story">
						<BlockList />
					</div>
				</ExperimentalBlockEditorProvider>
			</ArgsContext.Provider>
		);
	},
};
