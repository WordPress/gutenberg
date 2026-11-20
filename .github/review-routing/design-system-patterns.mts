import { readdir, readFile } from 'node:fs/promises';

const PATTERNS_DIRECTORY = new URL(
	'../../storybook/stories/design-system/patterns/',
	import.meta.url
);

/**
 * Lists the names of the documented design system patterns, from the heading
 * of each pattern document in Storybook.
 *
 * @return The pattern names.
 */
export default async function () {
	const names = ( await readdir( PATTERNS_DIRECTORY ) )
		// The introduction describes patterns in general, not one pattern.
		.filter(
			( name ) => name.endsWith( '.mdx' ) && name !== 'introduction.mdx'
		)
		.sort();

	const patterns = await Promise.all(
		names.map( async ( name ) => {
			const source = await readFile(
				new URL( name, PATTERNS_DIRECTORY ),
				'utf8'
			);
			const heading = source.match( /^# (.+)$/m );
			if ( ! heading ) {
				throw new Error( `${ name } has no heading.` );
			}
			return heading[ 1 ].trim();
		} )
	);

	return { patterns };
}
