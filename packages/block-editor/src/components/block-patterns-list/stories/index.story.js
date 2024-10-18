/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../';
import patterns from './fixtures';

const meta = {
	component: BlockPatternsList,
	title: 'BlockEditor/BlockPatternsList',
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
			description:
				'Orientation for arrow key navigation. Internally Composite component is used and it"s default value.',
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

export default meta;

const Template = ( props ) => {
	const shownPatterns = useAsyncList( props.blockPatterns );
	return <BlockPatternsList shownPatterns={ shownPatterns } { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	blockPatterns: patterns,
	isDraggable: false,
	label: 'Block patterns story',
	showTitle: true,
	showTitlesAsTooltip: false,
};
