/**
 * External dependencies
 */
import { extend } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import withLazyDependencies from '../higher-order/with-lazy-dependencies';

/**
 * Module constants
 */
const { UP, DOWN } = keycodes;

// TODO: How can we avoid repeating all of this?
const defaultSettings = {
	codemirror: {
		indentUnit: 4,
		indentWithTabs: true,
		inputStyle: 'contenteditable',
		lineNumbers: true,
		lineWrapping: true,
		styleActiveLine: true,
		continueComments: true,
		extraKeys: {
			'Ctrl-Space': 'autocomplete',
			'Ctrl-/': 'toggleComment',
			'Cmd-/': 'toggleComment',
			'Alt-F': 'findPersistent',
		},
		direction: 'ltr',
		gutters: [ 'CodeMirror-lint-markers' ],
		mode: 'htmlmixed',
		lint: true,
		autoCloseBrackets: true,
		autoCloseTags: true,
		matchTags: { bothTags: true },
	},
	csslint: {
		errors: true,
		'box-model': true,
		'display-property-grouping': true,
		'duplicate-properties': true,
		'known-properties': true,
		'outline-none': true,
	},
	htmlhint: {
		'tagname-lowercase': true,
		'attr-lowercase': true,
		'attr-value-double-quotes': true,
		'doctype-first': false,
		'tag-pair': true,
		'spec-char-escape': true,
		'id-unique': true,
		'src-not-empty': true,
		'attr-no-duplication': true,
		'alt-require': true,
		'space-tab-mixed-disabled': 'tab',
		'attr-unsafe-chars': true,
	},
	jshint: {
		boss: true,
		curly: true,
		eqeqeq: true,
		eqnull: true,
		es3: true,
		expr: true,
		immed: true,
		noarg: true,
		nonbsp: true,
		onevar: true,
		quotmark: 'single',
		trailing: true,
		undef: true,
		unused: true,
		browser: true,
		globals: { _: false, Backbone: false, jQuery: false, JSON: false, wp: false },
	},
};

class CodeEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.onCursorActivity = this.onCursorActivity.bind( this );
		this.onKeyHandled = this.onKeyHandled.bind( this );
	}

	componentDidMount() {
		extend( wp.codeEditor.defaultSettings, defaultSettings );

		const instance = wp.codeEditor.initialize( this.textarea );
		this.editor = instance.codemirror;

		this.editor.on( 'focus', this.onFocus );
		this.editor.on( 'blur', this.onBlur );
		this.editor.on( 'cursorActivity', this.onCursorActivity );
		this.editor.on( 'keyHandled', this.onKeyHandled );

		this.updateFocus();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.value !== prevProps.value && this.editor.getValue() !== this.props.value ) {
			this.editor.setValue( this.props.value );
		}

		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}
	}

	componentWillUnmount() {
		this.editor.on( 'focus', this.onFocus );
		this.editor.off( 'blur', this.onBlur );
		this.editor.off( 'cursorActivity', this.onCursorActivity );
		this.editor.off( 'keyHandled', this.onKeyHandled );

		this.editor.toTextArea();
		this.editor = null;
	}

	onFocus() {
		if ( this.props.onFocus ) {
			this.props.onFocus();
		}
	}

	onBlur( editor ) {
		if ( this.props.onChange ) {
			this.props.onChange( editor.getValue() );
		}
	}

	onCursorActivity( editor ) {
		this.lastCursor = editor.getCursor();
	}

	onKeyHandled( editor, name, event ) {
		/*
		 * Pressing UP/DOWN should only move focus to another block if the cursor is
		 * at the start or end of the editor.
		 * 
		 * We do this by stopping UP/DOWN from propagating if:
		 *  - We know what the cursor was before this event; AND
		 *  - This event caused the cursor to move 
		 */
		if ( event.keyCode === UP || event.keyCode === DOWN ) {
			const areCursorsEqual = ( a, b ) => a.line === b.line && a.ch === b.ch;
			if ( this.lastCursor && ! areCursorsEqual( editor.getCursor(), this.lastCursor ) ) {
				event.stopImmediatePropagation();
			}
		}
	}

	updateFocus() {
		if ( this.props.focus && ! this.editor.hasFocus() ) {
			// Need to wait for the next frame to be painted before we can focus the editor
			window.requestAnimationFrame( () => {
				this.editor.focus();
			} );
		}

		if ( ! this.props.focus && this.editor.hasFocus() ) {
			document.activeElement.blur();
		}
	}

	render() {
		return <textarea ref={ ref => ( this.textarea = ref ) } value={ this.props.value } />;
	}
}

export default withLazyDependencies( {
	scripts: [
		'wp-codemirror',
		'code-editor',
		'htmlhint',
		'csslint',
		'jshint',
		// TODO: Gotta check if user can unfiltered_html
		...( true ? [ 'htmlhint-kses' ] : [] ),
	],
	styles: [ 'wp-codemirror', 'code-editor' ],
} )( CodeEditor );
