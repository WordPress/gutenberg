/**
 * External dependencies
 */
// when this CSS was imported dynamically
// it was causing major visual glitches to
// the editor which completely broke it
require( 'codemirror/lib/codemirror.css' );

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import InspectorControls from '../../inspector-controls';
import { registerBlockType } from '../../api';

let initialized = false;
let CodeMirror; // loaded on-demand below

// there are more
// @see node_modules/codemirror/modes
// when supported we can probably replace with standard `import()` syntax
const modes = {
	apl: { label: 'APL', req: () => System.import( 'codemirror/mode/apl/apl' ) },
	clike: { label: 'C/C++/C#/Java', req: () => System.import( 'codemirror/mode/clike/clike' ) },
	clojure: { label: 'Clojure', req: () => System.import( 'codemirror/mode/clojure/clojure' ) },
	commonlisp: { label: 'Common Lisp', req: () => System.import( 'codemirror/mode/commonlisp/commonlisp' ) },
	css: { label: 'CSS', req: () => System.import( 'codemirror/mode/css/css' ) },
	diff: { label: 'diff', req: () => System.import( 'codemirror/mode/diff/diff' ) },
	ebnf: { label: 'EBNF', req: () => System.import( 'codemirror/mode/ebnf/ebnf' ) },
	elm: { label: 'Elm', req: () => System.import( 'codemirror/mode/elm/elm' ) },
	erlang: { label: 'Erlang', req: () => System.import( 'codemirror/mode/erlang/erlang' ) },
	gfm: { label: 'Markdown', req: () => System.import( 'codemirror/mode/gfm/gfm' ) },
	go: { label: 'go', req: () => System.import( 'codemirror/mode/go/go' ) },
	haskell: { label: 'Haskell', req: () => System.import( 'codemirror/mode/haskell/haskell' ) },
	htmlmixed: { label: 'HTML', req: () => System.import( 'codemirror/mode/htmlmixed/htmlmixed' ) },
	http: { label: 'HTTP', req: () => System.import( 'codemirror/mode/http/http' ) },
	javascript: { label: 'Javascript', req: () => System.import( 'codemirror/mode/javascript/javascript' ) },
	pegjs: { label: 'PEGjs', req: () => System.import( 'codemirror/mode/pegjs/pegjs' ) },
	php: { label: 'PHP', req: () => System.import( 'codemirror/mode/php/php' ) },
	python: { label: 'Python', req: () => System.import( 'codemirror/mode/python/python' ) },
	ruby: { label: 'Ruby', req: () => System.import( 'codemirror/mode/ruby/ruby' ) },
	rust: { label: 'Rust', req: () => System.import( 'codemirror/mode/rust/rust' ) },
	sass: { label: 'SASS', req: () => System.import( 'codemirror/mode/sass/sass' ) },
	shell: { label: 'Shell', req: () => System.import( 'codemirror/mode/shell/shell' ) },
	sql: { label: 'SQL', req: () => System.import( 'codemirror/mode/sql/sql' ) },
	swift: { label: 'Swift', req: () => System.import( 'codemirror/mode/swift/swift' ) },
	vue: { label: 'Vue', req: () => System.import( 'codemirror/mode/vue/vue' ) },
	xml: { label: 'XML', req: () => System.import( 'codemirror/mode/xml/xml' ) },
	yaml: { label: 'YAML', req: () => System.import( 'codemirror/mode/yaml/yaml' ) },
};

// just a sorted list for the UI
const languageList = Object.keys( modes ).sort( ( a, b ) => modes[ a ].label.localeCompare( modes[ b ].label ) );

registerBlockType( 'core/code-mirror', {
	title: __( 'Code Editor' ),
	icon: 'text',
	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'property',
			selector: 'code',
			property: 'textContent',
		},
		language: { type: 'string' },
	},

	edit( { attributes, focus, setAttributes, setFocus } ) {
		if ( ! initialized ) {
			require.ensure( [], require => {
				CodeMirror = require( 'react-codemirror' );
				initialized = true;
				setFocus();
			} );

			return <div style={ { fontFamily: 'monospace', whiteSpace: 'pre' } }>{ attributes.content }</div>;
		}

		const language = attributes.language;
		const modeData = modes[ language ];

		// make sure we load in the mode settings
		if ( language && modeData && ! modeData.hasLoaded ) {
			modeData.req().then( () => {
				modes[ language ].hasLoaded = true;
				setFocus();
			} );
		}

		// we have to force a refresh of the editor, so
		// don't actually load the language setting until
		// the mode file has loaded
		const mode = modeData && modeData.hasLoaded
			? language
			: undefined;

		return (
			<div>
				<CodeMirror
					value={ attributes.content }
					onChange={ value => setAttributes( { content: value } ) }
					options={ {
						lineNumbers: true,
						mode,
						readOnly: ! focus,
					} }
				/>
				{ focus && (
					<InspectorControls>
						<label className="blocks-text-control__label" htmlFor="blocks-codemirror-language-select">{ __( 'Language' ) }</label>
						<select // eslint-disable-line jsx-a11y/no-onchange
							id="blocks-codemirror-language-select"
							onChange={ ( { target: { value } } ) => setAttributes( { language: value } ) }
							value={ attributes.language }
						>
							{ languageList.map( key => (
								<option key={ key } value={ key }>
									{ modes[ key ].label }
								</option>
							) ) }
						</select>
					</InspectorControls>
				) }
			</div>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
