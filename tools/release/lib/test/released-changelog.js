import {
	getReleasedChangelogSection,
	isPackageChangelogPath,
	recomputeBackportedChangelog,
} from '../released-changelog';

const RELEASE_BASE = `# Changelog

## Unreleased

### Bug Fixes

-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))

### Internal

-   Shipped internal one. ([#2](https://github.com/WordPress/gutenberg/pull/2))
-   Shipped internal two. ([#3](https://github.com/WordPress/gutenberg/pull/3))

## 17.9.0 (2026-07-29)

### Enhancements

-   Older entry. ([#0](https://github.com/WordPress/gutenberg/pull/0))
`;

// The release rewrite performed by `updatePackages`: a version heading is
// inserted directly below `## Unreleased`.
const PUBLISHED = RELEASE_BASE.replace(
	'## Unreleased',
	'## Unreleased\n\n## 18.0.0 (2026-08-12)'
);

describe( 'recomputeBackportedChangelog', () => {
	it( 'keeps an entry added on the target branch out of the published version section', () => {
		// This is the shape git merges cleanly and wrongly: the new entry
		// sits in the middle of a subsection, far from the heading insertion.
		const branch = RELEASE_BASE.replace(
			'-   Shipped internal one. ([#2](https://github.com/WordPress/gutenberg/pull/2))',
			'-   Shipped internal one. ([#2](https://github.com/WordPress/gutenberg/pull/2))\n' +
				'-   Landed during publish. ([#9](https://github.com/WordPress/gutenberg/pull/9))'
		);

		expect(
			recomputeBackportedChangelog( {
				base: RELEASE_BASE,
				branch,
				filePath: 'packages/data/CHANGELOG.md',
				published: PUBLISHED,
			} )
		).toBe( `# Changelog

## Unreleased

### Internal

-   Landed during publish. ([#9](https://github.com/WordPress/gutenberg/pull/9))

## 18.0.0 (2026-08-12)

### Bug Fixes

-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))

### Internal

-   Shipped internal one. ([#2](https://github.com/WordPress/gutenberg/pull/2))
-   Shipped internal two. ([#3](https://github.com/WordPress/gutenberg/pull/3))

## 17.9.0 (2026-07-29)

### Enhancements

-   Older entry. ([#0](https://github.com/WordPress/gutenberg/pull/0))
` );
	} );

	it( 'keeps a new subsection added to an empty unreleased section above the version heading', () => {
		// This is the shape that conflicts in git: the base unreleased
		// section is empty, so the branch entry and the version heading are
		// inserted at the same line.
		const base = `# Changelog

## Unreleased

## 11.12.0 (2026-07-29)

-   Old. ([#0](https://github.com/WordPress/gutenberg/pull/0))
`;
		const published = base.replace(
			'## Unreleased',
			'## Unreleased\n\n## 11.13.0 (2026-08-12)'
		);
		const branch = base.replace(
			'## Unreleased',
			'## Unreleased\n\n### Bug Fixes\n\n-   Update git sources when `--update` is passed.'
		);

		expect(
			recomputeBackportedChangelog( {
				base,
				branch,
				filePath: 'packages/env/CHANGELOG.md',
				published,
			} )
		).toBe( `# Changelog

## Unreleased

### Bug Fixes

-   Update git sources when \`--update\` is passed.

## 11.13.0 (2026-08-12)

## 11.12.0 (2026-07-29)

-   Old. ([#0](https://github.com/WordPress/gutenberg/pull/0))
` );
	} );

	it( 'returns the released changelog when the target branch has not moved', () => {
		expect(
			recomputeBackportedChangelog( {
				base: RELEASE_BASE,
				branch: RELEASE_BASE,
				filePath: 'packages/data/CHANGELOG.md',
				published: PUBLISHED,
			} )
		).toBe( PUBLISHED );
	} );

	it( 'preserves new entries across existing and new subsections in branch order', () => {
		const branch = RELEASE_BASE.replace(
			'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))',
			'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))\n' +
				'-   New fix. ([#8](https://github.com/WordPress/gutenberg/pull/8))'
		).replace(
			'-   Shipped internal two. ([#3](https://github.com/WordPress/gutenberg/pull/3))',
			'-   Shipped internal two. ([#3](https://github.com/WordPress/gutenberg/pull/3))\n\n' +
				'### New Features\n\n' +
				'-   New feature. ([#7](https://github.com/WordPress/gutenberg/pull/7))'
		);

		const result = recomputeBackportedChangelog( {
			base: RELEASE_BASE,
			branch,
			filePath: 'packages/data/CHANGELOG.md',
			published: PUBLISHED,
		} );

		expect( result ).toContain( `## Unreleased

### Bug Fixes

-   New fix. ([#8](https://github.com/WordPress/gutenberg/pull/8))

### New Features

-   New feature. ([#7](https://github.com/WordPress/gutenberg/pull/7))

## 18.0.0 (2026-08-12)
` );
		expect( result ).toContain(
			'## 18.0.0 (2026-08-12)\n\n### Bug Fixes\n\n-   Shipped fix.'
		);
	} );

	it( 'treats a top-level list item with nested lines as one entry', () => {
		const base = `# Changelog

## Unreleased

### Breaking Changes

-   Removed the following components:
    -   \`ItemGroup\` ([#1](https://github.com/WordPress/gutenberg/pull/1))
    -   \`Flex\` ([#2](https://github.com/WordPress/gutenberg/pull/2))

## 39.0.0 (2026-07-29)
`;
		const published = base.replace(
			'## Unreleased',
			'## Unreleased\n\n## 40.0.0 (2026-08-12)'
		);
		const branch = base.replace(
			'    -   `Flex` ([#2](https://github.com/WordPress/gutenberg/pull/2))',
			'    -   `Flex` ([#2](https://github.com/WordPress/gutenberg/pull/2))\n' +
				'-   Deprecated the following components:\n' +
				'    -   `NewThing` ([#9](https://github.com/WordPress/gutenberg/pull/9))'
		);

		expect(
			recomputeBackportedChangelog( {
				base,
				branch,
				filePath: 'packages/components/CHANGELOG.md',
				published,
			} )
		).toBe( `# Changelog

## Unreleased

### Breaking Changes

-   Deprecated the following components:
    -   \`NewThing\` ([#9](https://github.com/WordPress/gutenberg/pull/9))

## 40.0.0 (2026-08-12)

### Breaking Changes

-   Removed the following components:
    -   \`ItemGroup\` ([#1](https://github.com/WordPress/gutenberg/pull/1))
    -   \`Flex\` ([#2](https://github.com/WordPress/gutenberg/pull/2))

## 39.0.0 (2026-07-29)
` );
	} );

	it( 'keeps entries added directly under the unreleased heading', () => {
		const base = `# Changelog

## Unreleased

-   Shipped loose entry. ([#1](https://github.com/WordPress/gutenberg/pull/1))

## 1.0.0 (2026-07-29)
`;
		const published = base.replace(
			'## Unreleased',
			'## Unreleased\n\n## 1.1.0 (2026-08-12)'
		);
		const branch = base.replace(
			'-   Shipped loose entry. ([#1](https://github.com/WordPress/gutenberg/pull/1))',
			'-   Shipped loose entry. ([#1](https://github.com/WordPress/gutenberg/pull/1))\n' +
				'-   New loose entry. ([#9](https://github.com/WordPress/gutenberg/pull/9))'
		);

		expect(
			recomputeBackportedChangelog( {
				base,
				branch,
				filePath: 'packages/a11y/CHANGELOG.md',
				published,
			} )
		).toBe( `# Changelog

## Unreleased

-   New loose entry. ([#9](https://github.com/WordPress/gutenberg/pull/9))

## 1.1.0 (2026-08-12)

-   Shipped loose entry. ([#1](https://github.com/WordPress/gutenberg/pull/1))

## 1.0.0 (2026-07-29)
` );
	} );

	it( 'removes only one occurrence of a duplicated entry', () => {
		const branch = RELEASE_BASE.replace(
			'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))',
			'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))\n' +
				'-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))'
		);

		expect(
			recomputeBackportedChangelog( {
				base: RELEASE_BASE,
				branch,
				filePath: 'packages/data/CHANGELOG.md',
				published: PUBLISHED,
			} )
		).toContain( `## Unreleased

### Bug Fixes

-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))

## 18.0.0 (2026-08-12)
` );
	} );

	it( 'throws when the released sections on the target branch diverge from the release base', () => {
		const branch = RELEASE_BASE.replace(
			'-   Older entry. ([#0](https://github.com/WordPress/gutenberg/pull/0))',
			'-   Older entry, reworded. ([#0](https://github.com/WordPress/gutenberg/pull/0))'
		);

		expect( () =>
			recomputeBackportedChangelog( {
				base: RELEASE_BASE,
				branch,
				filePath: 'packages/data/CHANGELOG.md',
				published: PUBLISHED,
			} )
		).toThrow(
			'packages/data/CHANGELOG.md: the released changelog sections on the target branch do not match the release base.'
		);
	} );

	it( 'throws when the target branch changelog has no unreleased heading', () => {
		expect( () =>
			recomputeBackportedChangelog( {
				base: RELEASE_BASE,
				branch: '# Changelog\n\n## 17.9.0 (2026-07-29)\n',
				filePath: 'packages/data/CHANGELOG.md',
				published: PUBLISHED,
			} )
		).toThrow(
			'packages/data/CHANGELOG.md: the target branch changelog has no "## Unreleased" heading.'
		);
	} );

	it( 'throws when the released changelog contains no version heading', () => {
		const content = '# Changelog\n\n## Unreleased\n\n-   Entry.\n';

		expect( () =>
			recomputeBackportedChangelog( {
				base: content,
				branch: content,
				filePath: 'packages/new-package/CHANGELOG.md',
				published: content,
			} )
		).toThrow(
			'packages/new-package/CHANGELOG.md: the released changelog contains no version heading.'
		);
	} );
} );

describe( 'getReleasedChangelogSection', () => {
	it( 'returns everything from the first version heading to the end', () => {
		expect( getReleasedChangelogSection( PUBLISHED ) )
			.toBe( `## 18.0.0 (2026-08-12)

### Bug Fixes

-   Shipped fix. ([#1](https://github.com/WordPress/gutenberg/pull/1))

### Internal

-   Shipped internal one. ([#2](https://github.com/WordPress/gutenberg/pull/2))
-   Shipped internal two. ([#3](https://github.com/WordPress/gutenberg/pull/3))

## 17.9.0 (2026-07-29)

### Enhancements

-   Older entry. ([#0](https://github.com/WordPress/gutenberg/pull/0))
` );
	} );

	it( 'returns an empty string when the changelog has no version heading', () => {
		expect(
			getReleasedChangelogSection( '# Changelog\n\n## Unreleased\n' )
		).toBe( '' );
	} );
} );

describe( 'isPackageChangelogPath', () => {
	it.each( [
		[ 'packages/env/CHANGELOG.md', true ],
		[ 'packages/block-editor/CHANGELOG.md', true ],
		[ 'packages/env/src/CHANGELOG.md', false ],
		[ 'packages/env/package.json', false ],
		[ 'CHANGELOG.md', false ],
	] )( 'classifies %s as %s', ( filePath, expected ) => {
		expect( isPackageChangelogPath( filePath ) ).toBe( expected );
	} );
} );
