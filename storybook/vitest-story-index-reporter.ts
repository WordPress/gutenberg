import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
	Reporter,
	TestCase,
	TestModule,
	TestRunEndReason,
} from 'vitest/node';

type StoryIndexEntry = {
	id: string;
	tags?: string[];
	type: string;
};

type StoryIndex = {
	entries: Record< string, StoryIndexEntry >;
};

const storyIndexPath = path.resolve( import.meta.dirname, 'build/index.json' );

export default class StoryIndexReporter implements Reporter {
	readonly #vitestStoryIds = new Set< string >();

	onTestCaseResult( testCase: TestCase ) {
		const { storyId } = testCase.meta() as { storyId?: unknown };

		if ( typeof storyId === 'string' ) {
			this.#vitestStoryIds.add( storyId );
		}
	}

	async onTestRunEnd(
		_testModules: readonly TestModule[],
		_unhandledErrors: readonly unknown[],
		reason: TestRunEndReason
	) {
		if ( reason !== 'passed' ) {
			return;
		}

		const storyIndex = JSON.parse(
			await readFile( storyIndexPath, 'utf8' )
		) as StoryIndex;
		const storybookStoryIds = new Set(
			Object.values( storyIndex.entries )
				.filter(
					( entry ) =>
						entry.type === 'story' && entry.tags?.includes( 'test' )
				)
				.map( ( entry ) => entry.id )
		);
		const missingFromVitest = [ ...storybookStoryIds ].filter(
			( storyId ) => ! this.#vitestStoryIds.has( storyId )
		);
		const missingFromStorybook = [ ...this.#vitestStoryIds ].filter(
			( storyId ) => ! storybookStoryIds.has( storyId )
		);

		if ( missingFromVitest.length || missingFromStorybook.length ) {
			throw new Error(
				[
					'Storybook and Vitest discovered different story IDs.',
					formatDifference(
						'Missing from Vitest',
						missingFromVitest
					),
					formatDifference(
						'Missing from Storybook',
						missingFromStorybook
					),
				]
					.filter( Boolean )
					.join( '\n' )
			);
		}
	}
}

function formatDifference( label: string, storyIds: string[] ) {
	if ( ! storyIds.length ) {
		return '';
	}

	return `${ label } (${ storyIds.length }):\n${ storyIds
		.sort()
		.map( ( storyId ) => `- ${ storyId }` )
		.join( '\n' ) }`;
}
