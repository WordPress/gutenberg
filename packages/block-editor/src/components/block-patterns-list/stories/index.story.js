/**
 * External dependencies
 */
import blockLibraryStyles from '!!raw-loader!../../../../../block-library/build-style/style.css';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../';
import { ExperimentalBlockEditorProvider } from '../../provider';
import patterns from './fixtures';

const blockEditorSettings = {
	styles: [ { css: blockLibraryStyles } ],
};

export default {
	component: BlockPatternsList,
	title: 'BlockEditor/BlockPatternsList',
};

export const Default = {
	render: function Template( props ) {
		return (
			<ExperimentalBlockEditorProvider settings={ blockEditorSettings }>
				<BlockPatternsList { ...props } />
			</ExperimentalBlockEditorProvider>
		);
	},
	args: {
		blockPatterns: patterns,
		isDraggable: false,
		label: 'Block patterns story',
		showTitlesAsTooltip: false,
	},
	argTypes: {
		blockPatterns: { description: 'The patterns to render.' },
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
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
	},
};
