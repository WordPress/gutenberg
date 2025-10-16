/**
 * External dependencies
 */
import blockLibraryStyles from '!!raw-loader!../../../../../block-library/build-style/style.css';

/**
 * Internal dependencies
 */
import BlockPatternsList from '..';
import patterns from './fixtures';
import { ExperimentalBlockEditorProvider } from '../../provider';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';
registerCoreBlocks();

const blockEditorSettings = {
	styles: [ { css: blockLibraryStyles } ],
};

/**
 * Storybook metadata
 */
const meta = {
	title: 'BlockEditor/BlockPatternsList',
	component: BlockPatternsList,
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `BlockPatternsList` component renders a list of block patterns.',
			},
		},
	},
	argTypes: {
		blockPatterns: {
			control: {
				type: 'object',
			},
			description: 'The patterns to render.',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		shownPatterns: {
			contorl: { type: null },
			description:
				'Usually this component is used with `useAsyncList` for performance reasons and you should provide the returned list from that hook. Alternatively it should have the same value with `blockPatterns.`',
			table: {
				type: {
					summary: 'object',
				},
			},
		},
		onClickPattern: {
			control: { type: null },
			description:
				'Callback function to handle the click event on a pattern.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		onHover: {
			control: {
				type: null,
			},
			description:
				'Callback function to handle the hover event on a pattern.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		showTitlesAsTooltip: {
			control: {
				type: 'boolean',
			},
			description:
				'Whether to render the title of each pattern as a tooltip. If enabled',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
		orientation: {
			control: {
				type: 'string',
			},
			description: 'Orientation for the underlying composite widget.',
			table: {
				defaultValue: {
					summary: 'both',
				},
				type: {
					summary: 'string',
				},
			},
		},
		category: {
			control: {
				type: 'string',
			},
			description: 'The currently selected pattern category.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		isDraggable: {
			control: {
				type: 'boolean',
			},
			description: 'Whether the pattern list item should be draggable.',
			table: {
				type: {
					summary: 'boolean',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		blockPatterns: patterns,
		isDraggable: false,
		label: __( 'Block patterns story' ),
		showTitlesAsTooltip: false,
	},
	render: function Template( args ) {
		return (
			<ExperimentalBlockEditorProvider settings={ blockEditorSettings }>
				<BlockPatternsList { ...args } />
			</ExperimentalBlockEditorProvider>
		);
	},
};
