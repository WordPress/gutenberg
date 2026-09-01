import { describe, expect, it } from 'vitest';
import {
	COMMENT_MARKER,
	demoteHeadings,
	isParseable,
	isPrMetaComment,
	mergeSection,
	parseSections,
	renderComment,
	sanitizeBody,
} from '../comment.ts';
import { SECTIONS, COMMENT_LIMIT, getSection } from '../sections.ts';

const HEAD = 'a'.repeat( 40 );
const OLD = 'b'.repeat( 40 );

function bodyOf( result: { body?: string } ) {
	if ( ! result.body ) {
		throw new Error( 'Expected a merged comment body.' );
	}
	return result.body;
}

describe( 'mergeSection', () => {
	it( 'creates a comment for the first section', () => {
		const { body } = mergeSection( undefined, {
			id: 'labels',
			body: 'Missing a type label.',
		} );

		expect( body ).toContain( COMMENT_MARKER );
		expect( body ).toContain( `#### ${ getSection( 'labels' )!.heading }` );
		expect( body ).toContain( 'Missing a type label.' );
	} );

	it( 'leaves other sections untouched when adding one', () => {
		const first = bodyOf(
			mergeSection( undefined, { id: 'labels', body: 'Label warning.' } )
		);
		const second = bodyOf(
			mergeSection(
				first,
				{ id: 'bundle-size', body: 'Size Change: 0 B', sha: HEAD },
				HEAD
			)
		);

		expect( second ).toContain( 'Label warning.' );
		expect( second ).toContain( 'Size Change: 0 B' );
	} );

	it( 'replaces a section rather than appending a second copy', () => {
		const first = bodyOf(
			mergeSection( undefined, { id: 'labels', body: 'Old warning.' } )
		);
		const second = bodyOf(
			mergeSection( first, { id: 'labels', body: 'New warning.' } )
		);

		expect( second ).not.toContain( 'Old warning.' );
		expect( parseSections( second ) ).toHaveLength( 1 );
	} );

	it( 'renders sections in registry order regardless of write order', () => {
		let comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'flaky-tests', body: 'Flaky.', sha: HEAD },
				HEAD
			)
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'props', body: 'Props.' } )
		);

		expect( parseSections( comment ).map( ( { id } ) => id ) ).toEqual( [
			'props',
			'flaky-tests',
		] );
	} );

	it( 'removes a section when the body is empty', () => {
		let comment = bodyOf(
			mergeSection( undefined, { id: 'props', body: 'Props.' } )
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'labels', body: 'Warning.' } )
		);

		const cleared = bodyOf(
			mergeSection( comment, { id: 'labels', body: '' } )
		);

		expect( parseSections( cleared ).map( ( { id } ) => id ) ).toEqual( [
			'props',
		] );
	} );

	it( 'asks for the comment to be removed once the last section goes', () => {
		const comment = bodyOf(
			mergeSection( undefined, { id: 'props', body: 'Props.' } )
		);

		expect( mergeSection( comment, { id: 'props', body: '' } ) ).toEqual( {
			remove: true,
		} );
	} );

	it( 'writes nothing when clearing a section of a comment that does not exist', () => {
		expect( mergeSection( undefined, { id: 'props', body: '' } ) ).toEqual(
			{
				remove: false,
			}
		);
	} );

	it( 'rejects an unknown section', () => {
		expect(
			mergeSection( undefined, { id: 'nope', body: 'Hello.' } ).rejected
		).toMatch( /Unknown section/ );
	} );

	it( 'preserves a section id it does not know', () => {
		const legacy = `${ COMMENT_MARKER }\n### PR meta\n\n<!-- pr-meta:section:from-the-future -->\nLater.\n<!-- /pr-meta:section:from-the-future -->\n`;

		const merged = bodyOf(
			mergeSection( legacy, { id: 'props', body: 'Props.' } )
		);

		expect( merged ).toContain( 'Later.' );
		expect( parseSections( merged ).map( ( { id } ) => id ) ).toEqual( [
			'props',
			'from-the-future',
		] );
	} );
} );

describe( 'staleness', () => {
	it( 'rejects a result for a commit that is neither the head nor the one reported', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'bundle-size', body: 'Current.', sha: HEAD },
				HEAD
			)
		);

		const result = mergeSection(
			comment,
			{ id: 'bundle-size', body: 'Stale rerun.', sha: OLD },
			HEAD
		);

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toContain( OLD );
	} );

	it( 'lets a rerun refresh the commit the section already reports', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'bundle-size', body: 'First attempt.', sha: OLD },
				OLD
			)
		);

		const merged = bodyOf(
			mergeSection(
				comment,
				{ id: 'bundle-size', body: 'Second attempt.', sha: OLD },
				HEAD
			)
		);

		expect( merged ).toContain( 'Second attempt.' );
	} );

	it( 'refuses to guess when the head cannot be read', () => {
		const result = mergeSection( undefined, {
			id: 'bundle-size',
			body: 'No head known.',
			sha: OLD,
		} );

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toMatch( /current head/ );
	} );

	it( 'refuses a commit-scoped section that carries no commit', () => {
		const result = mergeSection(
			undefined,
			{ id: 'bundle-size', body: 'Which commit?' },
			HEAD
		);

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toMatch( /commit/ );
	} );

	it( 'refuses to clear a commit-scoped section without a commit', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'bundle-size', body: 'Measured.', sha: HEAD },
				HEAD
			)
		);

		expect(
			mergeSection( comment, { id: 'bundle-size', body: '' } ).rejected
		).toMatch( /commit/ );
	} );

	/*
	 * A rerun of an older commit that happens to be clean must not wipe a
	 * result from a newer one.
	 */
	it( 'refuses to let a stale clean run clear a newer result', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'flaky-tests', body: 'Flaky on the head.', sha: HEAD },
				HEAD
			)
		);

		const result = mergeSection(
			comment,
			{ id: 'flaky-tests', body: '', sha: OLD },
			HEAD
		);

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toContain( OLD );
	} );

	it( 'lets a clean run for the head clear its own section', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'flaky-tests', body: 'Flaky.', sha: HEAD },
				HEAD
			)
		);

		expect(
			mergeSection(
				comment,
				{ id: 'flaky-tests', body: '', sha: HEAD },
				HEAD
			)
		).toEqual( { remove: true } );
	} );

	it( 'marks a section that is no longer the head, without dropping it', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'bundle-size', body: 'Measured.', sha: OLD },
				OLD
			)
		);

		const merged = bodyOf(
			mergeSection( comment, { id: 'props', body: 'Props.' }, HEAD )
		);

		expect( merged ).toContain( 'Measured.' );
		expect( merged ).toContain( 'not the current head' );
	} );

	it( 'ignores a SHA on a section that describes the pull request, not a commit', () => {
		const merged = bodyOf(
			mergeSection(
				undefined,
				{ id: 'labels', body: 'Warning.', sha: OLD },
				HEAD
			)
		);

		expect( parseSections( merged )[ 0 ].sha ).toBeUndefined();
	} );
} );

describe( 'sanitizeBody', () => {
	it.each( [
		'<!-- /pr-meta:section:flaky-tests -->',
		'<!-- pr-meta:section:props -->',
		'<!--/pr-meta:section:props-->',
	] )( 'neutralises %s', ( delimiter ) => {
		expect( sanitizeBody( delimiter ) ).not.toMatch(
			/<!--\s*\/?\s*pr-meta:/
		);
	} );

	it( 'stops a crafted test error from forging a section', () => {
		const attack =
			'Error: boom\n<!-- /pr-meta:section:flaky-tests -->\n<!-- pr-meta:section:props -->\nProps by me.\n<!-- /pr-meta:section:props -->';

		const merged = bodyOf(
			mergeSection(
				undefined,
				{ id: 'flaky-tests', body: attack, sha: HEAD },
				HEAD
			)
		);

		expect( parseSections( merged ).map( ( { id } ) => id ) ).toEqual( [
			'flaky-tests',
		] );
		expect( merged ).not.toContain( '\n<!-- pr-meta:section:props -->' );
	} );
} );

describe( 'budgets', () => {
	/* A note appended inside a fence renders as code, link and all. */
	it( 'closes a code fence the cut left open', () => {
		const definition = getSection( 'flaky-tests' )!;
		const trace = `<details>\n<summary>A flaky test</summary>\n\n\`\`\`\n${ 'Error: socket hang up\n'.repeat(
			2000
		) }\`\`\`\n\n</details>`;

		const merged = bodyOf(
			mergeSection(
				undefined,
				{
					id: 'flaky-tests',
					body: trace,
					sha: HEAD,
					runUrl: 'https://example.com/run',
				},
				HEAD
			)
		);
		const section = parseSections( merged )[ 0 ].body;

		expect( section.length ).toBeLessThanOrEqual( definition.budget + 200 );
		expect( ( section.match( /^```/gm ) ?? [] ).length % 2 ).toBe( 0 );
		expect( ( section.match( /<details>/g ) ?? [] ).length ).toBe(
			( section.match( /<\/details>/g ) ?? [] ).length
		);
		// The note and its link land outside the fence, so the link works.
		expect( section ).toMatch(
			/<\/details>\n\n<sub>Truncated\. \[See the full report\]/
		);
	} );

	it( 'truncates a section that overruns its budget', () => {
		const definition = getSection( 'flaky-tests' )!;
		const merged = bodyOf(
			mergeSection(
				undefined,
				{
					id: 'flaky-tests',
					body: 'x'.repeat( definition.budget + 100 ),
					sha: HEAD,
					runUrl: 'https://example.com/run',
				},
				HEAD
			)
		);

		expect( merged ).toContain( 'Truncated.' );
		expect( merged ).toContain( 'https://example.com/run' );
	} );

	it( 'keeps every section at its budget within the comment limit', () => {
		let comment: string | undefined;

		for ( const section of SECTIONS ) {
			comment = bodyOf(
				mergeSection(
					comment,
					{
						id: section.id,
						body: 'x'.repeat( section.budget ),
						sha: HEAD,
						runUrl: 'https://example.com/run',
					},
					HEAD
				)
			);
		}

		expect( comment!.length ).toBeLessThan( COMMENT_LIMIT );
	} );
} );

describe( 'isPrMetaComment', () => {
	it( 'matches only the unified comment', () => {
		expect( isPrMetaComment( renderComment( [] ) ) ).toBe( true );
		expect( isPrMetaComment( '<!-- flaky-tests-report-comment -->' ) ).toBe(
			false
		);
	} );
} );

describe( 'isParseable', () => {
	it( 'accepts a comment this action wrote', () => {
		const comment = bodyOf(
			mergeSection( undefined, { id: 'props', body: 'Props.' } )
		);

		expect( isParseable( comment ) ).toBe( true );
	} );

	it( 'rejects a comment with an unbalanced delimiter', () => {
		const truncated = `${ COMMENT_MARKER }\n### PR meta\n\n<!-- pr-meta:section:props -->\nProps.\n`;

		expect( isParseable( truncated ) ).toBe( false );
	} );
} );

describe( 'unknown sections', () => {
	it( 'holds a section it does not know to a budget', () => {
		const legacy = `${ COMMENT_MARKER }\n### PR meta\n\n<!-- pr-meta:section:from-the-future -->\n${ 'x'.repeat(
			10000
		) }\n<!-- /pr-meta:section:from-the-future -->\n`;

		const merged = bodyOf(
			mergeSection( legacy, { id: 'props', body: 'Props.' } )
		);

		expect( merged ).toContain( 'Truncated.' );
		expect( merged.length ).toBeLessThan( 10000 );
	} );
} );

describe( 'repeated writes', () => {
	/*
	 * Every write re-renders every section from what was parsed back, so any
	 * decoration kept inside the delimiters would stack up run after run.
	 */
	it( 'renders a heading once however many times the comment is written', () => {
		let comment = bodyOf(
			mergeSection( undefined, { id: 'props', body: 'Props.' } )
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'labels', body: 'Labels.' } )
		);
		comment = bodyOf(
			mergeSection(
				comment,
				{ id: 'bundle-size', body: 'Size.', sha: HEAD },
				HEAD
			)
		);

		const heading = `#### ${ getSection( 'props' )!.heading }`;
		expect( comment.split( heading ) ).toHaveLength( 2 );
		expect( parseSections( comment )[ 0 ].body ).toBe( 'Props.' );
	} );

	it( 'renders a commit footer once however many times it is written', () => {
		let comment = bodyOf(
			mergeSection(
				undefined,
				{
					id: 'bundle-size',
					body: 'Size.',
					sha: HEAD,
					runUrl: 'https://example.com/run',
				},
				HEAD
			)
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'props', body: 'Props.' }, HEAD )
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'labels', body: 'Labels.' }, HEAD )
		);

		expect( comment.match( /<sub>/g ) ).toHaveLength( 1 );
		expect( parseSections( comment ).at( -1 )?.body ).toBe( 'Size.' );
	} );
} );

describe( 'comment limit', () => {
	it( 'stays under the limit even with preserved unknown sections', () => {
		const unknown = Array.from(
			{ length: 40 },
			( _, index ) =>
				`<!-- pr-meta:section:future-${ index } -->\n${ 'x'.repeat(
					4000
				) }\n<!-- /pr-meta:section:future-${ index } -->`
		).join( '\n\n' );
		const legacy = `${ COMMENT_MARKER }\n### PR meta\n\n${ unknown }\n`;

		const merged = bodyOf(
			mergeSection( legacy, { id: 'props', body: 'Props.' } )
		);

		expect( merged.length ).toBeLessThanOrEqual( COMMENT_LIMIT );
		expect( merged ).toContain( 'Props.' );
	} );
} );

describe( 'collapsing', () => {
	it( 'folds a section long enough to warrant it', () => {
		const merged = bodyOf(
			mergeSection(
				undefined,
				{ id: 'performance', body: 'Tables.', sha: HEAD },
				HEAD
			)
		);

		expect( merged ).toContain(
			`<summary>${ getSection( 'performance' )!.summary }</summary>`
		);
	} );

	it( 'leaves a short section open', () => {
		const merged = bodyOf(
			mergeSection( undefined, { id: 'labels', body: 'Warning.' } )
		);

		expect( merged ).not.toContain( '<details>' );
	} );

	/* The fold sits outside the delimiters, so it cannot nest into itself. */
	it( 'folds once however many times the comment is written', () => {
		let comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'flaky-tests', body: 'Traces.', sha: HEAD },
				HEAD
			)
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'props', body: 'Props.' }, HEAD )
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'labels', body: 'Warning.' }, HEAD )
		);

		expect( comment.match( /<details>/g ) ).toHaveLength( 1 );
		expect(
			parseSections( comment ).find( ( s ) => s.id === 'flaky-tests' )
				?.body
		).toBe( 'Traces.' );
	} );
} );

describe( 'rendering other sections', () => {
	/*
	 * Every write re-renders every section, so a writer that does not know the
	 * head would quietly present an old result as current.
	 */
	it( 'keeps a stale result marked stale when another section is written', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{ id: 'bundle-size', body: 'Measured.', sha: OLD },
				OLD
			)
		);

		const merged = bodyOf(
			mergeSection( comment, { id: 'labels', body: 'Warning.' }, HEAD )
		);

		expect( merged ).toContain( 'not the current head' );
	} );
} );

describe( 'demoteHeadings', () => {
	it( 'pushes a props body below its own section heading', () => {
		const props =
			'## Unlinked Accounts\n\nSome text.\n\n## Core SVN\n\nMore text.';

		const merged = bodyOf(
			mergeSection( undefined, { id: 'props', body: props } )
		);

		expect( merged ).toContain( '##### Unlinked Accounts' );
		expect( merged ).toContain( '##### Core SVN' );
		expect( merged ).not.toMatch( /^## Unlinked/m );
	} );

	it( 'keeps the hierarchy between headings', () => {
		const body = '## Title\n\nText.\n\n### Deep\n\nText.';

		expect( demoteHeadings( body ) ).toBe(
			'##### Title\n\nText.\n\n###### Deep\n\nText.'
		);
	} );

	/*
	 * Markdown has no seventh level, so a body deep enough to need one loses
	 * the distinction rather than the demotion.
	 */
	it( 'flattens levels a demotion pushes past the sixth', () => {
		const body = '# One\n\n## Two\n\n### Three';

		expect( demoteHeadings( body ) ).toBe(
			'##### One\n\n###### Two\n\n###### Three'
		);
	} );

	it( 'leaves a body that has no headings alone', () => {
		const body = 'Just text, and a # that is not a heading.';

		expect( demoteHeadings( body ) ).toBe( body );
	} );

	/* A stack trace can hold anything, including lines that look like headings. */
	it.each( [
		[ 'a plain fence', '```', '```' ],
		[ 'a fence with a language', '```js', '```' ],
		[ 'a tilde fence', '~~~', '~~~' ],
	] )( 'ignores what looks like a heading inside %s', ( _, open, close ) => {
		const body = `## Real\n\n${ open }\n# Not a heading\n${ close }`;

		expect( demoteHeadings( body ) ).toBe(
			`##### Real\n\n${ open }\n# Not a heading\n${ close }`
		);
	} );

	/* Reading the level by hunting for a space loses the first word. */
	it( 'keeps the text of a heading separated by a tab', () => {
		expect( demoteHeadings( '#\tTabbed' ) ).toBe( '#####\tTabbed' );
	} );

	/*
	 * A `.` stops at a carriage return, so a CRLF body would match on its last
	 * line only, demoting that one and leaving every fence untracked.
	 */
	it( 'handles a body with carriage returns', () => {
		const body = '## Real\r\n\r\n```\r\n# inner\r\n```\r\n\r\n## After';

		expect( demoteHeadings( body ) ).toBe(
			'##### Real\r\n\r\n```\r\n# inner\r\n```\r\n\r\n##### After'
		);
	} );

	it( 'demotes a heading indented up to three spaces, keeping the indent', () => {
		expect( demoteHeadings( '   ## Indented' ) ).toBe(
			'   ##### Indented'
		);
	} );

	/* Four spaces makes it indented code rather than a heading. */
	it( 'leaves a heading indented four spaces alone', () => {
		expect( demoteHeadings( '    ## Code\n\n## Plain' ) ).toBe(
			'    ## Code\n\n##### Plain'
		);
	} );

	it( 'demotes a heading with no text', () => {
		expect( demoteHeadings( '#\n\n## Plain' ) ).toBe(
			'#####\n\n###### Plain'
		);
	} );

	it( 'leaves a hash that opens no heading alone', () => {
		expect( demoteHeadings( '## Real\n\n#hashtag' ) ).toBe(
			'##### Real\n\n#hashtag'
		);
	} );

	it( 'caps the demotion at the deepest heading level', () => {
		expect( demoteHeadings( '# One\n\n###### Six' ) ).toBe(
			'##### One\n\n###### Six'
		);
	} );
} );

describe( 'ordering a section with no commit', () => {
	/*
	 * The list is gathered before its writer takes the lock, so two runs can
	 * reach the lock in the opposite order to the views they hold.
	 */
	it( 'rejects a list gathered by an older run', () => {
		const comment = bodyOf(
			mergeSection( undefined, {
				id: 'props',
				body: 'Newer list.',
				generation: 200,
			} )
		);

		const result = mergeSection( comment, {
			id: 'props',
			body: 'Older list.',
			generation: 100,
		} );

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toContain( '100' );
	} );

	it( 'accepts a newer run, and a rerun of the same one', () => {
		let comment = bodyOf(
			mergeSection( undefined, {
				id: 'props',
				body: 'First.',
				generation: 100,
			} )
		);
		comment = bodyOf(
			mergeSection( comment, {
				id: 'props',
				body: 'Retry of the same run.',
				generation: 100,
			} )
		);
		comment = bodyOf(
			mergeSection( comment, {
				id: 'props',
				body: 'Newer run.',
				generation: 200,
			} )
		);

		expect( comment ).toContain( 'Newer run.' );
	} );

	it( 'does not order a section that a commit already orders', () => {
		const comment = bodyOf(
			mergeSection(
				undefined,
				{
					id: 'bundle-size',
					body: 'Size.',
					sha: HEAD,
					generation: 200,
				},
				HEAD
			)
		);

		expect( parseSections( comment )[ 0 ].generation ).toBeUndefined();
	} );
} );

describe( 'clearing a section that has an order', () => {
	/*
	 * Dropping the entry on clear would drop its generation with it, letting a
	 * run gathered earlier put the old content back.
	 */
	it( 'still rejects an older run after the section was cleared', () => {
		let comment = bodyOf(
			mergeSection( undefined, { id: 'labels', body: 'Warning.' } )
		);
		comment = bodyOf(
			mergeSection( comment, {
				id: 'props',
				body: 'Newer list.',
				generation: 200,
			} )
		);
		comment = bodyOf(
			mergeSection( comment, {
				id: 'props',
				body: '',
				generation: 200,
			} )
		);

		expect( comment ).not.toContain( 'Newer list.' );

		const result = mergeSection( comment, {
			id: 'props',
			body: 'Older list.',
			generation: 100,
		} );

		expect( result.body ).toBeUndefined();
		expect( result.rejected ).toContain( '100' );
	} );

	it( 'renders a cleared section as nothing at all', () => {
		let comment = bodyOf(
			mergeSection( undefined, { id: 'labels', body: 'Warning.' } )
		);
		comment = bodyOf(
			mergeSection( comment, {
				id: 'props',
				body: 'A list.',
				generation: 200,
			} )
		);
		comment = bodyOf(
			mergeSection( comment, { id: 'props', body: '', generation: 200 } )
		);

		expect( comment ).not.toContain( getSection( 'props' )!.heading );

		// Invisible, but still present and still carrying its generation.
		const props = parseSections( comment ).find(
			( section ) => section.id === 'props'
		);
		expect( props ).toBeDefined();
		expect( props?.generation ).toBe( 200 );
	} );

	it( 'removes the comment once nothing visible is left', () => {
		const comment = bodyOf(
			mergeSection( undefined, {
				id: 'props',
				body: 'A list.',
				generation: 200,
			} )
		);

		expect(
			mergeSection( comment, { id: 'props', body: '', generation: 200 } )
		).toEqual( { remove: true } );
	} );
} );
