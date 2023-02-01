/**
 * Internal dependencies
 */
import BlockLibrary from '../library';
import { ExperimentalBlockEditorProvider } from '../../provider';
import { patternCategories, patterns, reusableBlocks } from './utils/fixtures';
import Inserter from '../';

export default { title: 'BlockEditor/Inserter' };

export const libraryWithoutPatterns = () => {
	const wrapperStyle = {
		margin: '24px',
		height: 400,
		border: '1px solid #f3f3f3',
		display: 'inline-block',
	};
	return (
		<ExperimentalBlockEditorProvider>
			<div style={ wrapperStyle }>
				<BlockLibrary showInserterHelpPanel />
			</div>
		</ExperimentalBlockEditorProvider>
	);
};

export const libraryWithPatterns = () => {
	const wrapperStyle = {
		margin: '24px',
		height: 400,
		border: '1px solid #f3f3f3',
		display: 'inline-block',
	};
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

export const libraryWithPatternsAndReusableBlocks = () => {
	const wrapperStyle = {
		margin: '24px',
		height: 400,
		border: '1px solid #f3f3f3',
		display: 'inline-block',
	};
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

export const quickInserter = () => {
	const wrapperStyle = {
		margin: '24px',
		height: 400,
		border: '1px solid #f3f3f3',
		display: 'inline-block',
	};
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
