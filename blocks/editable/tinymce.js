/**
 * External dependencies
 */
import tinymce from 'tinymce';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';

export default class TinyMCE extends Component {
	componentDidMount() {
		this.initialize();
	}

	componentWillUnmount() {
		if ( ! this.editor ) {
			return;
		}

		this.editor.destroy();
		delete this.editor;
	}

	initialize() {
		const { focus } = this.props;

		const settings = this.props.getSettings( {
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			convert_urls: false,
			plugins: [],
			formats: {
				strikethrough: { inline: 'del' },
			},
		} );

		settings.plugins.push( 'paste' );

		tinymce.init( {
			...settings,
			target: this.editorNode,
			setup: ( editor ) => {
				this.editor = editor;
				this.props.onSetup( editor );
			},
		} );

		if ( focus ) {
			this.editorNode.focus();
		}
	}

	render() {
		const { tagName = 'div', style, label, className, isPlaceholderVisible } = this.props;

		return createElement( tagName, {
			ref: ( node ) => this.editorNode = node,
			contentEditable: true,
			suppressContentEditableWarning: true,
			className: classnames( className, 'blocks-editable__tinymce' ),
			style,
			'aria-label': label,
			'data-is-placeholder-visible': isPlaceholderVisible,
		} );
	}
}
