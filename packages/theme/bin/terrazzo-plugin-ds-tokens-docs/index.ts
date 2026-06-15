import { FORMAT_ID } from '@terrazzo/plugin-css';
import type { Plugin } from '@terrazzo/parser';

function titleCase( str: string ) {
	return str[ 0 ].toUpperCase() + str.slice( 1 );
}

const STATIC_PREAMBLE = `Design tokens are named values. They encode design decisions which describe the visual purpose of a value. Rather than referencing a raw value like \`#3858e9\`, a token like \`--wpds-color-background-interactive-brand-strong\` describes what the value is for. Tokens are delivered as CSS custom properties and consumed with \`var( --wpds-* )\`.

## How to pick a token

Each segment of a token name answers one question about the value being applied:

-   **Type** identifies the kind of value, like \`color\` or \`dimension\`. It is usually determined by the CSS property being set.
-   **Property** describes which aspect of the element the token applies to, such as \`background\`, \`foreground\`, \`stroke\`, \`padding\`, or \`gap\`.
-   **Target** describes the kind of element the token applies to, such as a \`surface\`, an \`interactive\` control, static \`content\`, a \`track\` or \`thumb\`, or a \`focus\` indicator.
-   **Tone** describes the semantic intent of a color, such as \`neutral\`, \`brand\`, \`success\`, or \`error\`.
-   **Emphasis** and **state** are modifiers that adjust strength and reflect interactive states.

## Naming pattern

Semantic tokens follow a consistent naming pattern:

\`\`\`
--wpds-<type>-<property>-<target>[-<modifier>]
\`\`\`

### Type

Indicates what kind of value the token represents, usually mapping to a [DTCG](https://design-tokens.github.io/community-group/format/) token type.

| Value        | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| \`color\`      | Color values for backgrounds, foregrounds, and strokes                         |
| \`dimension\`  | Spacing, sizing, and other measurable lengths (e.g., padding, margins, widths) |
| \`border\`     | Border properties like radius and width                                        |
| \`elevation\`  | Shadow definitions for layering and depth                                      |
| \`motion\`     | Animation durations and easing curves                                          |
| \`typography\` | Typography properties like font family, font size, and line-height             |

### Property

The specific design property being defined.

| Value         | Description                        |
| ------------- | ---------------------------------- |
| \`background\`  | Background color                   |
| \`foreground\`  | Foreground color (text and icons)  |
| \`stroke\`      | Border and outline color           |
| \`padding\`     | Internal spacing within an element |
| \`gap\`         | Spacing between elements           |
| \`radius\`      | Border radius for rounded corners  |
| \`width\`       | Border width                       |
| \`duration\`    | Animation duration                 |
| \`easing\`      | Animation easing curve             |
| \`font-size\`   | Font size                          |
| \`font-family\` | Font family                        |
| \`font-weight\` | Font weight                        |
| \`line-height\` | Line height                        |

### Target

The component or element type the token applies to.

| Value         | Description                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| \`surface\`     | Backgrounds and borders of containers, cards, panels, message bubbles, and other static layout elements. Not for clickable parts. |
| \`interactive\` | Elements the user directly interacts with: buttons, inputs, links, checkboxes, toggles, menu items. Implies a clickable/focusable affordance. |
| \`content\`     | Static content like body text and icons. Use for foreground colors where there is no interactive behavior.                        |
| \`track\`       | The non-moving rail of a track-and-thumb control (scrollbar track, slider track, progressbar track).                              |
| \`thumb\`       | The moving indicator of a track-and-thumb control (scrollbar thumb, slider handle, filled progress).                              |
| \`focus\`       | Focus indicators and rings.                                                                                                       |

### Modifier

An optional size or intensity modifier.

| Value                                      | Description          |
| ------------------------------------------ | -------------------- |
| \`xs\`, \`sm\`, \`md\`, \`lg\`, \`xl\`, \`2xl\`, \`3xl\` | Size scale modifiers |

## Color token modifiers

Color tokens extend the base pattern with additional modifiers for tone, emphasis, and state:

\`\`\`
--wpds-color-<property>-<target>-<tone>[-<emphasis>][-<state>]
\`\`\`

### Tone

The semantic intent of the color.

| Value     | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| \`neutral\` | Neutrally toned UI elements                                                             |
| \`brand\`   | Brand-accented or primary action colors                                                 |
| \`success\` | Positive or completed states                                                            |
| \`info\`    | Informational or system-generated context                                               |
| \`caution\` | Heads-up or low-severity issues; "proceed carefully"                                    |
| \`warning\` | Higher-severity or time-sensitive issues that require user attention but are not errors |
| \`error\`   | Blocking issues, validation failures, or destructive actions                            |

Note: \`caution\` and \`warning\` represent two escalation levels of non-error severity. Use **\`caution\`** for guidance or minor risks, and **\`warning\`** when the user must act to prevent an error.

### Emphasis

Adjusts color strength relative to the base tone. The default (no modifier) is normal emphasis.

| Value    | Description                                    |
| -------- | ---------------------------------------------- |
| \`strong\` | Higher contrast and/or elevated emphasis       |
| \`weak\`   | Subtle variant for secondary or muted elements |

### State

The interactive state of the element. The default (no modifier) is the idle state.

| Value      | Description                         |
| ---------- | ----------------------------------- |
| \`active\`   | Hovered, pressed, or selected state |
| \`disabled\` | Unavailable or inoperable state     |
`;

type TokensMap = Record< string, Record< string, string > >;

export default function pluginDsTokenDocs( {
	filename = 'design-tokens.md',
} = {} ): Plugin {
	return {
		name: '@terrazzo/terrazzo-plugin-ds-tokens-docs',
		async build( { getTransforms, outputFile } ) {
			if ( ! filename ) {
				return;
			}

			const semanticTokens: TokensMap = {};
			// Re-use transformed tokens from the CSS plugin
			for ( const token of getTransforms( {
				format: FORMAT_ID,
				id: '*',
				mode: '.',
			} ) ) {
				if ( token.localID === undefined ) {
					console.warn(
						'Unexpected — Missing local ID when building token list for eslint plugin'
					);
					continue;
				}

				// Use the tokens filename (without .json) as the group name
				const group =
					token.token.source.loc
						?.split( '/' )
						.at( -1 )
						?.split( '.json' )[ 0 ] ?? 'Miscellaneous';

				// Group by category
				semanticTokens[ group ] ??= {};
				semanticTokens[ group ][ token.localID ] =
					token.token.$description ?? 'N/A';
			}

			function tokensToMdTable( tokens: TokensMap ) {
				return Object.entries( tokens )
					.map( ( [ group, tokensInGroup ] ) => [
						`### ${ titleCase( group ) }`,
						'',
						'| Variable name | Description |',
						'|---|---|',
						...Object.entries( tokensInGroup ).map(
							( [ name, description ] ) =>
								`| \`${ name }\` | ${ description } |`
						),
						'',
					] )
					.flat( 2 );
			}

			outputFile(
				filename,
				[
					'<!--',
					'This file is generated by @terrazzo/terrazzo-plugin-ds-tokens-docs.',
					'Do not edit directly.',
					'-->',
					'',
					'# Design System Tokens reference',
					'',
					STATIC_PREAMBLE,
					'',
					'## Semantic tokens',
					'',
					...tokensToMdTable( semanticTokens ),
					'', // final empty line
				].join( '\n' )
			);
		},
	};
}
