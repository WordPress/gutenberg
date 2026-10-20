import { describe, expect, it } from 'vitest';
import {
	mdxToMarkdown,
	parseGuidanceDocs,
	parseGuidanceList,
} from '../parse-guidance';
import type { ManifestComponent } from '../types';

const MDX = `import { Canvas, Markdown, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './usage-guidelines.story';

<Meta of={ Stories } />

# Button guidance

<Canvas of={ Stories.Default } />

<Markdown>{ \`
| Goal | Component |
| --- | --- |
| Act | [Button](?path=/docs/button--docs), \\\`<button>\\\` |
\` }</Markdown>
`;

const components: Record< string, ManifestComponent > = {
	'ui-button': {
		id: 'ui-button',
		name: 'Button',
		path: '../packages/ui/src/button/stories/index.story.tsx',
		docs: {
			'ui-button--usage-guidelines': {
				id: 'ui-button--usage-guidelines',
				name: 'Usage Guidelines',
				summary: 'Pick the right button.',
				content: MDX,
			},
			broken: {
				id: 'broken',
				name: 'Broken',
				content: 'x',
				error: { name: 'Error', message: 'nope' },
			},
		},
	},
	outside: {
		id: 'outside',
		name: 'Other',
		path: '../other/index.story.tsx',
		docs: { o: { id: 'o', name: 'O', content: '# O' } },
	},
};

const standalone = {
	tokens: {
		id: 'tokens',
		name: 'Introduction',
		title: 'Design System/Tokens/Introduction',
		content: '# Tokens',
	},
};

describe( 'mdxToMarkdown', () => {
	it( 'drops Storybook constructs and unwraps Markdown blocks', () => {
		const result = mdxToMarkdown( MDX );
		expect( result ).not.toMatch( /import |<Meta|<Canvas|<Markdown/ );
		expect( result ).toContain( '# Button guidance' );
		expect( result ).toContain( '| Act | Button, `<button>` |' );
	} );
} );

describe( 'parseGuidanceList', () => {
	it( 'lists attached and standalone pages, skipping errors and non-package components', () => {
		const list = parseGuidanceList( components, standalone );
		expect( list.map( ( p ) => p.id ) ).toEqual( [
			'ui-button--usage-guidelines',
			'tokens',
		] );
		expect( list[ 0 ] ).toMatchObject( {
			title: 'Button guidance',
			summary: 'Pick the right button.',
			components: [ 'Button' ],
		} );
	} );
} );

describe( 'parseGuidanceDocs', () => {
	it( 'matches by id, title, or component name', () => {
		expect(
			parseGuidanceDocs( components, standalone, 'tokens' )
		).toHaveLength( 1 );
		expect(
			parseGuidanceDocs( components, standalone, 'button guidance' )
		).toHaveLength( 1 );
		expect(
			parseGuidanceDocs( components, standalone, 'BUTTON' )
		).toHaveLength( 1 );
		expect(
			parseGuidanceDocs( components, standalone, 'nothing' )
		).toEqual( [] );
	} );
} );
