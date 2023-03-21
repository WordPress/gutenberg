/**
 * Internal dependencies
 */
import BlockLibrary from '../library';
import BlockEditorProvider from '../../provider';
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
		<BlockEditorProvider>
			<div style={ wrapperStyle }>
				<BlockLibrary showInserterHelpPanel />
			</div>
		</BlockEditorProvider>
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
		<BlockEditorProvider
			settings={ {
				__experimentalBlockPatternCategories: patternCategories,
				__experimentalBlockPatterns: patterns,
			} }
		>
			<div style={ wrapperStyle }>
				<BlockLibrary showInserterHelpPanel />
			</div>
		</BlockEditorProvider>
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
		<BlockEditorProvider
			settings={ {
				__experimentalBlockPatternCategories: patternCategories,
				__experimentalBlockPatterns: patterns,
				__experimentalReusableBlocks: reusableBlocks,
			} }
		>
			<div style={ wrapperStyle }>
				<BlockLibrary showInserterHelpPanel />
			</div>
		</BlockEditorProvider>
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
		<BlockEditorProvider
			settings={ {
				__experimentalBlockPatternCategories: patternCategories,
				__experimentalBlockPatterns: patterns,
				__experimentalReusableBlocks: reusableBlocks,
			} }
		>
			<div style={ wrapperStyle }>
				<Inserter __experimentalIsQuick />
			</div>
		</BlockEditorProvider>
	);
};
