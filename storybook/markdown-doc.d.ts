/**
 * A Markdown document rewritten for Storybook by the `markdownDoc` Vite plugin.
 */
declare module '*.md?doc' {
	const content: string;
	export default content;
}
