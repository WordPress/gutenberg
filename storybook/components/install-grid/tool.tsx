import type { ReactNode } from 'react';

export type ToolProps = {
	label: string;
	/** Logo (an SVG file). A generic `{}` badge is shown when omitted. */
	logo?: string;
	/** The tool's instructions, written as Markdown in the docs page. */
	children: ReactNode;
};

/**
 * One tool in the grid. `InstallGrid` reads its props to draw the tile and
 * renders its children as the panel when the tile is selected.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Tool( _props: ToolProps ) {
	return null;
}
