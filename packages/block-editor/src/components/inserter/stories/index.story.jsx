/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import BlockLibrary from '../library';
import { ExperimentalBlockEditorProvider } from '../../provider';
import { patternCategories, patterns, reusableBlocks } from './utils/fixtures';
import Inserter from '../';

// For the purpose of this story, we need to register the core blocks samples.
registerCoreBlocks();

const wrapperStyle = {
	margin: '24px',
	height: 400,
	border: '1px solid #f3f3f3',
	display: 'inline-block',
};

export default {
	title: 'BlockEditor/Inserter',
	component: Inserter,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'The Inserter is the primary interface for adding blocks, patterns, and media to the content.',
			},
		},
	},
};

export const LibraryWithoutPatterns = {
	parameters: {
		docs: {
			description: {
				story: 'Displays the standard block library panel without any patterns registered.',
			},
		},
	},
	render: () => {
		return (
			<ExperimentalBlockEditorProvider>
				<div style={ wrapperStyle }>
					<BlockLibrary showInserterHelpPanel />
				</div>
			</ExperimentalBlockEditorProvider>
		);
	},
};

export const LibraryWithPatterns = {
	parameters: {
		docs: {
			description: {
				story: 'Displays the block library panel including the "Patterns" tab.',
			},
		},
	},
	render: () => {
		return (
			<ExperimentalBlockEditorProvider
				settings={ {
					__experimentalBlockPatternCategories: patternCategories,
					__experimentalBlockPatterns: patterns,
				} }
			>
				<div style={ wrapperStyle }>
					<BlockLibrary showInserterHelpPanel />
				</div>
			</ExperimentalBlockEditorProvider>
		);
	},
};

export const LibraryWithPatternsAndReusableBlocks = {
	parameters: {
		docs: {
			description: {
				story: 'Displays the block library including both Patterns and Reusable Blocks tab.',
			},
		},
	},
	render: () => {
		return (
			<ExperimentalBlockEditorProvider
				settings={ {
					__experimentalBlockPatternCategories: patternCategories,
					__experimentalBlockPatterns: patterns,
					__experimentalReusableBlocks: reusableBlocks,
				} }
			>
				<div style={ wrapperStyle }>
					<BlockLibrary showInserterHelpPanel />
				</div>
			</ExperimentalBlockEditorProvider>
		);
	},
};

export const FullInserter = {
	parameters: {
		docs: {
			description: {
				story: 'Shows the full `<Inserter />` component, which includes the toggle button that opens the library panel.',
			},
		},
	},
	render: () => {
		return (
			<ExperimentalBlockEditorProvider
				settings={ {
					__experimentalBlockPatternCategories: patternCategories,
					__experimentalBlockPatterns: patterns,
					__experimentalReusableBlocks: reusableBlocks,
				} }
			>
				<div style={ wrapperStyle }>
					<Inserter />
				</div>
			</ExperimentalBlockEditorProvider>
		);
	},
};

export const QuickInserter = {
	parameters: {
		docs: {
			description: {
				story: 'Shows the "Quick Inserter" (slash inserter) variant.',
			},
		},
	},
	render: () => {
		return (
			<ExperimentalBlockEditorProvider
				settings={ {
					__experimentalBlockPatternCategories: patternCategories,
					__experimentalBlockPatterns: patterns,
					__experimentalReusableBlocks: reusableBlocks,
				} }
			>
				<div style={ wrapperStyle }>
					<Inserter __experimentalIsQuick />
				</div>
			</ExperimentalBlockEditorProvider>
		);
	},
};
