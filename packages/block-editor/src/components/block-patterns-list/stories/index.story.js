/**
 * External dependencies
 */
import blockLibraryStyles from '!!raw-loader!../../../../../block-library/build-style/style.css';

/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';

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
		const shownPatterns = useAsyncList( props.blockPatterns );
		return (
			<ExperimentalBlockEditorProvider settings={ blockEditorSettings }>
				<BlockPatternsList
					shownPatterns={ shownPatterns }
					{ ...props }
				/>
			</ExperimentalBlockEditorProvider>
		);
	},
	args: {
		blockPatterns: patterns,
		isDraggable: false,
		label: 'Block patterns story',
		showTitle: true,
		showTitlesAsTooltip: false,
	},
	argTypes: {
		blockPatterns: { description: 'The patterns to render.' },
		shownPatterns: {
			description:
				'Usually this component is used with `useAsyncList` for performance reasons and you should provide the returned list from that hook. Alternatively it should have the same value with `blockPatterns`.',
		},
		showTitle: {
			description: 'Whether to render the title of each pattern.',
			table: {
				defaultValue: { summary: true },
				type: { summary: 'boolean' },
			},
		},
		onClickPattern: { type: 'function' },
		onHover: { type: 'function' },
		showTitlesAsTooltip: {
			description:
				'Whether to render the title of each pattern as a tooltip. If enabled, it takes precedence over `showTitle` prop.',
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
