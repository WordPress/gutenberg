import { globSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { sanitize, toId } from 'storybook/internal/csf';
import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, it } from 'vitest';
import { readComponentStatus } from '../status-indexer';

const ROOT_DIR = path.resolve( import.meta.dirname, '../..' );
const RULE_FILE = 'packages/eslint-plugin/rules/use-recommended-components.js';

const { DENYLIST } = createRequire( import.meta.url )(
	path.join( ROOT_DIR, RULE_FILE )
) as { DENYLIST: Record< string, Record< string, string > > };

const NOT_RECOMMENDED_WITHOUT_DENYLIST_ENTRY = [
	// Kept off the denylist in #81658: `InputControl` from `@wordpress/ui`
	// does not clamp to `min` and `max` or align to `step` on blur.
	'NumberControl',
];

type Story = {
	file: string;
	id: string;
	component?: string;
	status?: string;
	tags: string[];
};

type MigrationGuide = {
	file: string;
	docsId: string;
	story?: Story;
};

function readStories(): Story[] {
	return globSync( 'packages/components/src/**/stories/*.story.{jsx,tsx}', {
		cwd: ROOT_DIR,
	} )
		.sort()
		.map( ( file ) => {
			const csf = loadCsf(
				readFileSync( path.join( ROOT_DIR, file ), 'utf8' ),
				{ fileName: file, makeTitle: ( title ) => title ?? file }
			).parse();

			return {
				file,
				id: csf.meta.id ?? sanitize( csf.meta.title ?? file ),
				component: readLocalComponentName( csf ),
				status: readComponentStatus( csf._metaAnnotations.parameters ),
				tags: csf.meta.tags ?? [],
			};
		} );
}

function readLocalComponentName(
	csf: ReturnType< ReturnType< typeof loadCsf >[ 'parse' ] >
): string | undefined {
	const component = csf._metaAnnotations.component;
	if ( component?.type !== 'Identifier' ) {
		return undefined;
	}

	const isImportedFromPackage = csf._ast.program.body.some(
		( node ) =>
			node.type === 'ImportDeclaration' &&
			! node.source.value.startsWith( '.' ) &&
			node.specifiers.some(
				( specifier ) => specifier.local.name === component.name
			)
	);

	return isImportedFromPackage ? undefined : component.name;
}

function readMigrationGuides( stories: Story[] ): MigrationGuide[] {
	return globSync( 'packages/components/src/**/stories/migration-guide.mdx', {
		cwd: ROOT_DIR,
	} )
		.sort()
		.map( ( file ) => {
			const source = readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
			const meta = source.match( /<Meta\s[^>]*>/ )?.[ 0 ] ?? '';
			const storiesName = meta.match( /\bof=\{\s*(\w+)\s*\}/ )?.[ 1 ];
			const name = meta.match( /\bname="([^"]+)"/ )?.[ 1 ];
			const storiesPath = source.match(
				new RegExp( `import \\* as ${ storiesName } from '([^']+)'` )
			)?.[ 1 ];
			if ( ! storiesName || ! name || ! storiesPath ) {
				return { file, docsId: '' };
			}

			const storiesFile = path.join( path.dirname( file ), storiesPath );
			const story = stories.find(
				( { file: storyFile } ) =>
					storyFile.replace( /\.[jt]sx$/, '' ) === storiesFile
			);

			return {
				file,
				docsId: story ? toId( story.id, name ) : '',
				story,
			};
		} );
}

const denylist = DENYLIST[ '@wordpress/components' ];
const denylistEntriesByComponent = new Map(
	Object.entries( denylist ).map( ( [ key, message ] ) => [
		key.replace( /^__experimental/, '' ),
		{ key, message },
	] )
);
const stories = readStories();
const componentStories = stories.filter(
	( story ): story is Story & { component: string } => !! story.component
);
const migrationGuides = readMigrationGuides( stories );

type StatusMismatch = {
	component: string;
	kind: 'missing-denylist-entry' | 'denylisted-status';
	message: string;
};

function findStatusMismatches(): StatusMismatch[] {
	const mismatches: StatusMismatch[] = [];
	for ( const { file, component, status } of componentStories ) {
		const entry = denylistEntriesByComponent.get( component );
		if ( status === 'not-recommended' && ! entry ) {
			mismatches.push( {
				component,
				kind: 'missing-denylist-entry',
				message: `${ component } is "not-recommended" in ${ file }, but is not in DENYLIST in ${ RULE_FILE }. Add a denylist entry, or change the story's status.`,
			} );
		} else if ( entry && status !== 'not-recommended' ) {
			mismatches.push( {
				component,
				kind: 'denylisted-status',
				message: `${ entry.key } is in DENYLIST in ${ RULE_FILE }, but its status in ${ file } is ${
					status ? `"${ status }"` : 'missing'
				}. Set the story's status to "not-recommended", or remove the denylist entry.`,
			} );
		}
	}
	return mismatches;
}

describe( '@wordpress/components recommendation status', () => {
	it( 'reads the stories and migration guides', () => {
		expect( componentStories ).not.toHaveLength( 0 );
		expect( migrationGuides ).not.toHaveLength( 0 );
		const unreadFiles = [
			...stories
				.filter( ( { component, status } ) => status && ! component )
				.map(
					( { file } ) =>
						`Could not match ${ file } to a component of @wordpress/components. Set the meta's \`component\` to a component imported from this package.`
				),
			...migrationGuides
				.filter( ( { story } ) => ! story )
				.map(
					( { file } ) =>
						`Could not find the story file that ${ file } refers to. Check its <Meta of> and name, and the import of its stories.`
				),
		];

		expect( unreadFiles ).toEqual( [] );
	} );

	it( 'marks a component "not-recommended" exactly when it is in the denylist', () => {
		const mismatches = findStatusMismatches()
			.filter(
				( { component, kind } ) =>
					kind !== 'missing-denylist-entry' ||
					! NOT_RECOMMENDED_WITHOUT_DENYLIST_ENTRY.includes(
						component
					)
			)
			.map( ( { message } ) => message );

		expect( mismatches ).toEqual( [] );
	} );

	it( 'lists only exceptions that still apply', () => {
		const missingEntries = new Set(
			findStatusMismatches()
				.filter( ( { kind } ) => kind === 'missing-denylist-entry' )
				.map( ( { component } ) => component )
		);
		const staleExceptions = NOT_RECOMMENDED_WITHOUT_DENYLIST_ENTRY.filter(
			( component ) => ! missingEntries.has( component )
		).map(
			( component ) =>
				`${ component } no longer needs an entry in NOT_RECOMMENDED_WITHOUT_DENYLIST_ENTRY in this test. Remove it.`
		);

		expect( staleExceptions ).toEqual( [] );
	} );

	it( 'leaves "not-recommended" stories out of the manifest', () => {
		const manifestStories = componentStories
			.filter(
				( { status, tags } ) =>
					status === 'not-recommended' && tags.includes( 'manifest' )
			)
			.map(
				( { file } ) =>
					`${ file } is "not-recommended" but has the \`manifest\` tag. Remove the tag, then run \`npm run storybook:build\` and \`npm run storybook:manifest-snapshot\`.`
			);

		expect( manifestStories ).toEqual( [] );
	} );

	it( 'links the migration guide of a "not-recommended" component from its denylist message', () => {
		const unlinkedGuides = migrationGuides.flatMap(
			( { file, docsId, story } ) => {
				if (
					story?.status !== 'not-recommended' ||
					! story.component
				) {
					return [];
				}
				const entry = denylistEntriesByComponent.get( story.component );
				if (
					! entry ||
					entry.message.includes( `?path=/docs/${ docsId }` )
				) {
					return [];
				}
				return [
					`The ${ entry.key } message in DENYLIST in ${ RULE_FILE } does not link ${ file }. Add "See the migration guide: https://wordpress.github.io/gutenberg/?path=/docs/${ docsId }".`,
				];
			}
		);

		expect( unlinkedGuides ).toEqual( [] );
	} );

	it( 'links only migration guides that exist', () => {
		const guideIds = new Set(
			migrationGuides.map( ( { docsId } ) => docsId )
		);
		const brokenLinks = Object.entries( denylist ).flatMap(
			( [ key, message ] ) =>
				[
					...message.matchAll(
						/\?path=\/docs\/([\w-]+--migration-guide)/g
					),
				]
					.filter( ( [ , id ] ) => ! guideIds.has( id ) )
					.map(
						( [ , id ] ) =>
							`The ${ key } message in DENYLIST in ${ RULE_FILE } links ${ id }, which is not the ID of any migration-guide.mdx under packages/components. Fix the link, or the guide's story \`id\` or <Meta name>.`
					)
		);

		expect( brokenLinks ).toEqual( [] );
	} );
} );
