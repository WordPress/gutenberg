/**
 * External dependencies
 */
import tinymce from 'tinymce';
import { isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Children, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { diffAriaProps, pickAriaProps } from './aria';

export default class TinyMCE extends Component {
	componentDidMount() {
		this.initialize();
	}

	shouldComponentUpdate() {
		// We must prevent rerenders because TinyMCE will modify the DOM, thus
		// breaking React's ability to reconcile changes.
		//
		// See: https://github.com/facebook/react/issues/6802
		return false;
	}

	componentWillReceiveProps( nextProps ) {
		const name = 'data-is-placeholder-visible';
		const isPlaceholderVisible = String( !! nextProps.isPlaceholderVisible );

		if ( this.editorNode.getAttribute( name ) !== isPlaceholderVisible ) {
			this.editorNode.setAttribute( name, isPlaceholderVisible );
		}

		if ( ! isEqual( this.props.style, nextProps.style ) ) {
			this.editorNode.setAttribute( 'style', '' );
			Object.assign( this.editorNode.style, nextProps.style );
		}

		if ( ! isEqual( this.props.className, nextProps.className ) ) {
			this.editorNode.className = classnames( nextProps.className, 'blocks-rich-text__tinymce' );
		}

		const { removedKeys, updatedKeys } = diffAriaProps( this.props, nextProps );
		removedKeys.forEach( ( key ) =>
			this.editorNode.removeAttribute( key ) );
		updatedKeys.forEach( ( key ) =>
			this.editorNode.setAttribute( key, nextProps[ key ] ) );
	}

	componentWillUnmount() {
		if ( ! this.editor ) {
			return;
		}

		// This hack prevents TinyMCE from trying to remove the container node
		// while cleaning for destroy, since removal is handled by React. It
		// does so by substituting the container to be removed.
		this.editor.container = document.createDocumentFragment();
		this.editor.destroy();
		delete this.editor;
	}

	initialize() {
		const settings = this.props.getSettings( {
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			convert_urls: false,
			inline_boundaries_selector: 'a[href],code,b,i,strong,em,del,ins,sup,sub',
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
	}

	render() {
		const { tagName = 'div', style, defaultValue, className } = this.props;
		const ariaProps = pickAriaProps( this.props );

		// If a default value is provided, render it into the DOM even before
		// TinyMCE finishes initializing. This avoids a short delay by allowing
		// us to show and focus the content before it's truly ready to edit.
		let children;
		if ( defaultValue ) {
			children = Children.toArray( defaultValue );
		}

		return createElement( tagName, {
			ref: ( node ) => this.editorNode = node,
			contentEditable: true,
			suppressContentEditableWarning: true,
			className: classnames( className, 'blocks-rich-text__tinymce' ),
			style,
			...ariaProps,
		}, children );
	}
}
