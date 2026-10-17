import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
// @ts-expect-error Vite loads the `?raw` stylesheet as a string, which TypeScript cannot resolve.
import blockLibraryStyles from '@wordpress/block-library/build-style/style.css?raw';
import BlockPatternsList from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';
import patterns from './fixtures';

const blockEditorSettings = {
	styles: [ { css: blockLibraryStyles } ],
};

const meta = {
	component: BlockPatternsList,
	id: 'blockeditor-blockpatternslist',
	title: 'Editor/Block Editor/BlockPatternsList',
} satisfies Meta< typeof BlockPatternsList >;
export default meta;

export const Default: StoryObj< typeof meta > = {
	render: function Template( props ) {
		return (
			<ExperimentalBlockEditorProvider settings={ blockEditorSettings }>
				<BlockPatternsList { ...props } />
			</ExperimentalBlockEditorProvider>
		);
	},
	args: {
		// @ts-expect-error The fixtures provide only the blocks the list renders.
		blockPatterns: patterns,
		isDraggable: false,
		label: 'Block patterns story',
		showTitlesAsTooltip: false,
		onClickPattern: fn(),
		onHover: fn(),
	},
	argTypes: {
		blockPatterns: { description: 'The patterns to render.' },
		// @ts-expect-error Bug: the list has no `shownPatterns` prop.
		shownPatterns: {
			description:
				'Usually this component is used with `useAsyncList` for performance reasons and you should provide the returned list from that hook. Alternatively it should have the same value with `blockPatterns`.',
		},
		onClickPattern: { type: 'function' },
		onHover: { type: 'function' },
		showTitlesAsTooltip: {
			description:
				'Whether to render the title of each pattern as a tooltip. If enabled',
		},
		orientation: {
			description: 'Orientation for the underlying composite widget.',
			table: {
				defaultValue: { summary: 'both' },
				type: { summary: 'string' },
			},
		},
		category: { description: 'The currently selected pattern category.' },
		isDraggable: {
			description: 'Whether the pattern list item should be draggable.',
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
