/**
 * External Dependencies
 */
import MarkdownIt from 'markdown-it';
import markdownItPrismPlugin from 'markdown-it-prism';
import markdownItTOCAndAnchorPlugin from 'markdown-it-toc-and-anchor';
import { compact } from 'lodash';

const parser = new MarkdownIt( {
	html: true,
	linkify: true,
} );
parser
	.use( markdownItTOCAndAnchorPlugin )
	.use( markdownItPrismPlugin );

const blockParsers = {
	raw( content ) {
		return {
			type: 'raw',
			content: parser.render( content ),
		};
	},

	codetabs( content ) {
		const tabsRegex = /{%\s+([\w]+)\s+%}/gm;
		const splittedTabs = compact( content.trim().split( tabsRegex ) );
		const tabs = [];
		for ( let i = 0; i < splittedTabs.length; i = i + 2 ) {
			tabs.push( {
				name: splittedTabs[ i ],
				content: parser.render( splittedTabs[ i + 1 ] ),
			} );
		}

		return {
			type: 'codetabs',
			tabs,
		};
	},
};

function parse( markdown ) {
	const blocksRegex = /({%\s+[\w]+\s+%}(?:.|\n|\r)*?{%\s+end\s+%})/gm;
	const blockRegex = /{%\s+([\w]+)\s+%}((?:.|\n|\r)*?){%\s+end\s+%}/gm;
	const blocks = markdown.split( blocksRegex );
	return blocks
		.map( ( block ) => {
			const matches = blockRegex.exec( block );
			if ( ! matches ) {
				return { type: 'raw', content: block };
			}
			return { type: matches[ 1 ], content: matches[ 2 ] };
		} )
		.map( ( block ) => {
			const blockParser = blockParsers[ block.type ] || blockParsers.raw;

			return blockParser( block.content );
		} );
}

export default parse;
