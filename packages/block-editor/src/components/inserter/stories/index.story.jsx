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

export default { title: 'BlockEditor/Inserter' };

// For the purpose of this story, we need to register the core blocks samples.
registerCoreBlocks();

const wrapperStyle = {
	margin: '24px',
	height: 400,
	border: '1px solid #f3f3f3',
	display: 'inline-block',
};

export const LibraryWithoutPatterns = () => {
	return (
		<ExperimentalBlockEditorProvider>
			<div style={ wrapperStyle }>
				<BlockLibrary showInserterHelpPanel />
			</div>
		</ExperimentalBlockEditorProvider>
	);
};

export const LibraryWithPatterns = () => {
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
};

export const LibraryWithPatternsAndReusableBlocks = () => {
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
};

export const FullInserter = () => {
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
};

export const QuickInserter = () => {
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
};
