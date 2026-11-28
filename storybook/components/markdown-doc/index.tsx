import { Canvas, Markdown } from '@storybook/addon-docs/blocks';
import { Fragment } from '@wordpress/element';
import type { ComponentProps } from 'react';

type CanvasProps = ComponentProps< typeof Canvas >;

const STORYBOOK_URL = 'https://wordpress.github.io/gutenberg/';

/*
 * Render Markdown elements without a wrapper, so that every segment's elements
 * are siblings in the docs page, as they are in an MDX page. Storybook styles
 * rely on this, such as the zero top margin of only the first heading.
 */
const MARKDOWN_OPTIONS = { wrapper: Fragment };

/*
 * Matches a story marker and everything up to its closing marker:
 *
 *     <!-- story: StoryName sourceState="shown" -->
 *     ...fallback content for readers outside Storybook...
 *     <!-- /story -->
 */
const STORY_MARKER =
	/<!-- story: (\w+)(?: sourceState="(hidden|shown|none)")? -->[\s\S]*?<!-- \/story -->/g;

/**
 * Renders a Markdown document that is also published outside Storybook, such
 * as a guide in a package's `docs` folder.
 *
 * - Absolute links to the published Storybook become relative `?path=` links,
 *   so they navigate within the current Storybook.
 * - Each story marker is replaced with a live `Canvas` of the matching story.
 *   The content between the markers, usually a code example, is shown only
 *   to readers outside Storybook.
 *
 * @param props         Component props.
 * @param props.content Raw Markdown, typically imported with `?raw`.
 * @param props.stories Stories that markers in the document can embed, by name.
 */
export function MarkdownDoc( {
	content,
	stories = {},
}: {
	content: string;
	stories?: Record< string, CanvasProps[ 'of' ] >;
} ) {
	const markdown = content.replaceAll(
		`](${ STORYBOOK_URL }?path=`,
		'](?path='
	);
	const parts = [];
	let lastIndex = 0;

	for ( const match of markdown.matchAll( STORY_MARKER ) ) {
		const [ marker, name, sourceState ] = match;
		const story = stories[ name ];

		if ( ! story ) {
			throw new Error( `MarkdownDoc: no story passed for "${ name }".` );
		}

		parts.push(
			<Markdown key={ parts.length } options={ MARKDOWN_OPTIONS }>
				{ markdown.slice( lastIndex, match.index ) }
			</Markdown>,
			<Canvas
				key={ parts.length + 1 }
				of={ story }
				sourceState={ sourceState as CanvasProps[ 'sourceState' ] }
			/>
		);
		lastIndex = match.index + marker.length;
	}

	parts.push(
		<Markdown key={ parts.length } options={ MARKDOWN_OPTIONS }>
			{ markdown.slice( lastIndex ) }
		</Markdown>
	);

	return <>{ parts }</>;
}
