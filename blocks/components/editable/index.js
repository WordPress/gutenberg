/**
 * External dependencies
 */
import classnames from 'classnames';
import { last } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

export default class Editable extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.bindNode = this.bindNode.bind( this );
		this.onFocus = this.onFocus.bind( this );
	}

	componentDidMount() {
		this.initialize();
	}

	initialize() {
		const config = {
			target: this.node,
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			setup: this.onSetup,
			formats: {
				strikethrough: { inline: 'del' }
			}
		};

		tinymce.init( config );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
	}

	onInit() {
		const { value = '' } = this.props;
		this.editor.setContent( value );
		this.focus();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}
		const value = this.editor.getContent();
		this.editor.save();
		this.props.onChange( value );
	}

	onNewBlock() {
		if ( this.props.tagName || ! this.props.onSplit ) {
			return;
		}

		// Getting the content before and after the cursor
		const childNodes = Array.from( this.editor.getBody().childNodes );
		let selectedChild = this.editor.selection.getStart();
		while ( childNodes.indexOf( selectedChild ) === -1 && selectedChild.parentNode ) {
			selectedChild = selectedChild.parentNode;
		}
		const splitIndex = childNodes.indexOf( selectedChild );
		if ( splitIndex === -1 ) {
			return;
		}
		const getHtml = ( nodes ) => nodes.reduce( ( memo, node ) => memo + node.outerHTML, '' );
		const beforeNodes = childNodes.slice( 0, splitIndex );
		const lastNodeBeforeCursor = last( beforeNodes );
		// Avoid splitting on single enter
		if (
			! lastNodeBeforeCursor ||
			beforeNodes.length < 2 ||
			!! lastNodeBeforeCursor.textContent
		) {
			return;
		}
		const before = getHtml( beforeNodes.slice( 0, beforeNodes.length - 1 ) );
		const after = getHtml( childNodes.slice( splitIndex ) );

		// Splitting into two blocks
		this.editor.setContent( this.props.value || '' );
		const hasAfter = !! childNodes.slice( splitIndex )
			.reduce( ( memo, node ) => memo + node.textContent, '' );
		this.props.onSplit( before, hasAfter ? after : '' );
	}

	bindNode( ref ) {
		this.node = ref;
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.editor.setContent( this.props.value );
		this.editor.selection.moveToBookmark( bookmark );
	}

	focus() {
		if ( this.props.focus ) {
			this.editor.focus();
		}
	}

	componentWillUpdate( nextProps ) {
		if ( this.editor && this.props.tagName !== nextProps.tagName ) {
			this.editor.destroy();
		}
	}

	componentWillUnmount() {
		if ( this.editor ) {
			this.editor.destroy();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.tagName !== prevProps.tagName ) {
			this.initialize();
		}

		if ( !! this.props.focus && ! prevProps.focus ) {
			this.focus();
		}

		if (
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value
		) {
			this.updateContent();
		}
	}

	render() {
		const { tagName: Tag = 'div', style, className } = this.props;
		const classes = classnames( 'blocks-editable', className );

		return (
			<Tag
				ref={ this.bindNode }
				style={ style }
				className={ classes } />
		);
	}
}
