/**
 * External dependencies
 */
import memoize from 'memize';
import type { FindAllArgs } from 'highlight-words-core';
import { findAll } from 'highlight-words-core';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Source:
 * https://github.com/bvaughn/react-highlight-words/blob/HEAD/src/Highlighter.js
 */

/**
 * @typedef Options
 * @property {string}                            [activeClassName='']      Classname for active highlighted areas.
 * @property {number}                            [activeIndex=-1]          The index of the active highlighted area.
 * @property {React.CSSProperties}               [activeStyle]             Styles to apply to the active highlighted area.
 * @property {boolean}                           [autoEscape]              Whether to automatically escape text.
 * @property {boolean}                           [caseSensitive=false]     Whether to highlight in a case-sensitive manner.
 * @property {string}                            children                  Children to highlight.
 * @property {FindAllArgs['findChunks']}         [findChunks]              Custom `findChunks` function to pass to `highlight-words-core`.
 * @property {string | Record<string, unknown>}  [highlightClassName='']   Classname to apply to highlighted text or a Record of classnames to apply to given text (which should be the key).
 * @property {React.CSSProperties}               [highlightStyle={}]       Styles to apply to highlighted text.
 * @property {keyof React.JSX.IntrinsicElements} [highlightTag='mark']     Tag to use for the highlighted text.
 * @property {FindAllArgs['sanitize']}           [sanitize]                Custom `sanitize` function to pass to `highlight-words-core`.
 * @property {string[]}                          [searchWords=[]]          Words to search for and highlight.
 * @property {string}                            [unhighlightClassName=''] Classname to apply to unhighlighted text.
 * @property {React.CSSProperties}               [unhighlightStyle]        Style to apply to unhighlighted text.
 */

interface Options {
	activeClassName?: string;
	activeIndex?: number;
	activeStyle?: React.CSSProperties;
	autoEscape?: boolean;
	caseSensitive?: boolean;
	children: string;
	findChunks?: FindAllArgs[ 'findChunks' ];
	highlightClassName?: string | Record< string, unknown >;
	highlightStyle?: React.CSSProperties;
	highlightTag?: keyof React.JSX.IntrinsicElements;
	sanitize?: FindAllArgs[ 'sanitize' ];
	searchWords?: string[];
	unhighlightClassName?: string;
	unhighlightStyle?: React.CSSProperties;
}

/**
 * Maps props to lowercase names.
 *
 * @param object Props to map.
 * @return The mapped props.
 */
const lowercaseProps = < T extends Record< string, unknown > >( object: T ) => {
	const mapped: Record< string, unknown > = {};
	for ( const key in object ) {
		mapped[ key.toLowerCase() ] = object[ key ];
	}
	return mapped as { [ K in keyof T as Lowercase< string & K > ]: T[ K ] };
};

const memoizedLowercaseProps = memoize( lowercaseProps );

/**
 * @param options
 * @param options.activeClassName
 * @param options.activeIndex
 * @param options.activeStyle
 * @param options.autoEscape
 * @param options.caseSensitive
 * @param options.children
 * @param options.findChunks
 * @param options.highlightClassName
 * @param options.highlightStyle
 * @param options.highlightTag
 * @param options.sanitize
 * @param options.searchWords
 * @param options.unhighlightClassName
 * @param options.unhighlightStyle
 */
export function createHighlighterText( {
	activeClassName = '',
	activeIndex = -1,
	activeStyle,
	autoEscape,
	caseSensitive = false,
	children,
	findChunks,
	highlightClassName = '',
	highlightStyle = {},
	highlightTag = 'mark',
	sanitize,
	searchWords = [],
	unhighlightClassName = '',
	unhighlightStyle,
}: Options ) {
	if ( ! children ) {
		return null;
	}
	if ( typeof children !== 'string' ) {
		return children;
	}

	const textToHighlight = children;

	const chunks = findAll( {
		autoEscape,
		caseSensitive,
		findChunks,
		sanitize,
		searchWords,
		textToHighlight,
	} );
	const HighlightTag = highlightTag;
	let highlightIndex = -1;
	let highlightClassNames = '';
	let highlightStyles;

	const textContent = chunks.map( ( chunk, index ) => {
		const text = textToHighlight.substr(
			chunk.start,
			chunk.end - chunk.start
		);

		if ( chunk.highlight ) {
			highlightIndex++;

			let highlightClass;
			if ( typeof highlightClassName === 'object' ) {
				if ( ! caseSensitive ) {
					highlightClassName =
						memoizedLowercaseProps( highlightClassName );
					highlightClass = highlightClassName[ text.toLowerCase() ];
				} else {
					highlightClass = highlightClassName[ text ];
				}
			} else {
				highlightClass = highlightClassName;
			}

			const isActive = highlightIndex === +activeIndex;

			highlightClassNames = `${ highlightClass } ${
				isActive ? activeClassName : ''
			}`;
			highlightStyles =
				isActive === true && activeStyle !== null
					? Object.assign( {}, highlightStyle, activeStyle )
					: highlightStyle;

			const props: Record< string, unknown > = {
				children: text,
				className: highlightClassNames,
				key: index,
				style: highlightStyles,
			};

			// Don't attach arbitrary props to DOM elements; this triggers React DEV warnings (https://fb.me/react-unknown-prop)
			// Only pass through the highlightIndex attribute for custom components.
			if ( typeof HighlightTag !== 'string' ) {
				props.highlightIndex = highlightIndex;
			}

			return createElement( HighlightTag, props );
		}
		return createElement( 'span', {
			children: text,
			className: unhighlightClassName,
			key: index,
			style: unhighlightStyle,
		} );
	} );

	return textContent;
}
