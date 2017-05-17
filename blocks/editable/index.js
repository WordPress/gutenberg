/**
 * External dependencies
 */
import classnames from 'classnames';
import { last, isEqual, capitalize, omitBy, forEach, merge } from 'lodash';
import { nodeListToReact } from 'dom-react';
import { Fill } from 'react-slot-fill';
import 'element-closest';

/**
 * WordPress dependencies
 */
import Toolbar from 'components/toolbar';

/**
 * Internal dependencies
 */
import './style.scss';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';

const KEYCODE_BACKSPACE = 8;
const KEYCODE_DELETE = 46;

const alignmentMap = {
	alignleft: 'left',
	alignright: 'right',
	aligncenter: 'center',
};

const ALIGNMENT_CONTROLS = [
	{
		icon: 'editor-alignleft',
		title: wp.i18n.__( 'Align left' ),
		align: 'left',
	},
	{
		icon: 'editor-aligncenter',
		title: wp.i18n.__( 'Align center' ),
		align: 'center',
	},
	{
		icon: 'editor-alignright',
		title: wp.i18n.__( 'Align right' ),
		align: 'right',
	},
];

const LIST_CONTROLS = [
	{
		list: 'UL',
		icon: 'editor-ul',
		title: wp.i18n.__( 'Convert to unordered' ),
		cmd: 'InsertUnorderedList',
	},
	{
		list: 'OL',
		icon: 'editor-ol',
		title: wp.i18n.__( 'Convert to ordered' ),
		cmd: 'InsertOrderedList',
	},
	{
		icon: 'editor-outdent',
		title: wp.i18n.__( 'Outdent list item' ),
		cmd: 'Outdent',
	},
	{
		icon: 'editor-indent',
		title: wp.i18n.__( 'Indent list item' ),
		cmd: 'Indent',
	},
];

function createElement( type, props, ...children ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return children;
	}

	return wp.element.createElement(
		type,
		omitBy( props, ( value, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...children
	);
}

export default class Editable extends wp.element.Component {
	constructor( props ) {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );

		this.state = {
			formats: {},
			alignment: null,
			bookmark: null,
			empty: ! props.value || ! props.value.length,
		};
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'selectionChange', this.onSelectionChange );
	}

	onInit() {
		this.updateFocus();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();
	}

	isActive() {
		return document.activeElement === this.editor.getBody();
	}

	onSelectionChange() {
		// We must check this because selectionChange is a global event.
		if ( ! this.isActive() ) {
			return;
		}

		const content = this.getContent();

		this.setState( {
			empty: ! content || ! content.length,
		} );
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	getRelativePosition( node ) {
		const position = node.getBoundingClientRect();

		// Find the parent "relative" positioned container
		const container = this.props.inlineToolbar
			? this.editor.getBody().closest( '.blocks-editable' )
			: this.editor.getBody().closest( '.editor-visual-editor__block' );
		const containerPosition = container.getBoundingClientRect();
		const blockPadding = 14;
		const blockMoverMargin = 18;

		// These offsets are necessary because the toolbar where the link modal lives
		// is absolute positioned and it's not shown when we compute the position here
		// so we compute the position about its parent relative position and adds the offset
		const toolbarOffset = this.props.inlineToolbar
			? { top: 50, left: 0 }
			: { top: 40, left: -( ( blockPadding * 2 ) + blockMoverMargin ) };
		const linkModalWidth = 250;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	isStartOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = range.startContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.firstChild !== child ) {
				return false;
			}
		}
		return true;
	}

	isEndOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.endOffset !== range.endContainer.textContent.length || ! range.collapsed ) {
			return false;
		}
		const start = range.endContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.lastChild !== child ) {
				return false;
			}
		}
		return true;
	}

	onKeyDown( event ) {
		if (
			this.props.onMerge && (
				( event.keyCode === KEYCODE_BACKSPACE && this.isStartOfEditor() ) ||
				( event.keyCode === KEYCODE_DELETE && this.isEndOfEditor() )
			)
		) {
			const forward = event.keyCode === KEYCODE_DELETE;
			this.onChange();
			this.props.onMerge( forward );
			event.preventDefault();
			event.stopImmediatePropagation();
		}
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

		const before = beforeNodes.slice( 0, beforeNodes.length - 1 );

		// Removing empty nodes from the beginning of the "after"
		// avoids empty paragraphs at the beginning of newly created blocks.
		const after = childNodes.slice( splitIndex ).reduce( ( memo, node ) => {
			if ( ! memo.length && ! node.textContent ) {
				return memo;
			}

			memo.push( node );
			return memo;
		}, [] );

		// Splitting into two blocks
		this.setContent( this.props.value );

		this.props.onSplit(
			nodeListToReact( before, createElement ),
			nodeListToReact( after, createElement )
		);
	}

	onNodeChange( { element, parents } ) {
		const formats = {};
		const link = parents.find( ( node ) => node.nodeName.toLowerCase() === 'a' );
		if ( link ) {
			formats.link = { value: link.getAttribute( 'href' ), link };
		}
		const activeFormats = this.editor.formatter.matchAll( [	'bold', 'italic', 'strikethrough' ] );
		activeFormats.forEach( ( activeFormat ) => formats[ activeFormat ] = true );
		const alignments = this.editor.formatter.matchAll( [ 'alignleft', 'aligncenter', 'alignright' ] );
		const alignment = alignments.length > 0 ? alignmentMap[ alignments[ 0 ] ] : null;
		const aList = this.editor.dom.getParent( element, 'OL,UL' );
		const list = aList ? { type: aList.nodeName, isInternal: aList !== this.editor.getBody() } : null;

		const focusPosition = this.getRelativePosition( element );
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.setState( { alignment, bookmark, formats, focusPosition, list } );
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.savedContent = this.props.value;
		this.setContent( this.savedContent );
		this.editor.selection.moveToBookmark( bookmark );
		// Saving the editor on updates avoid unecessary onChanges calls
		// These calls can make the focus jump

		this.editor.save();
	}

	setContent( content ) {
		if ( ! content ) {
			content = '';
		}

		content = wp.element.renderToString( content );
		this.editor.setContent( content, { format: 'raw' } );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createElement );
	}

	updateFocus() {
		const { focus } = this.props;
		if ( focus ) {
			this.editor.focus();
			// Offset = -1 means we should focus the end of the editable
			if ( focus.offset === -1 ) {
				this.editor.selection.select( this.editor.getBody(), true );
				this.editor.selection.collapse( false );
			}
		} else {
			this.editor.getBody().blur();
		}
	}

	componentWillUnmount() {
		this.onChange();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}

		// The savedContent var allows us to avoid updating the content right after an onChange call
		if (
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value &&
			this.props.value !== this.savedContent &&
			! isEqual( this.props.value, prevProps.value ) &&
			! isEqual( this.props.value, this.savedContent )
		) {
			this.updateContent();
		}
	}

	isFormatActive( format ) {
		return !! this.state.formats[ format ];
	}

	changeFormats( formats ) {
		if ( this.state.bookmark ) {
			this.editor.selection.moveToBookmark( this.state.bookmark );
		}

		forEach( formats, ( formatValue, format ) => {
			if ( format === 'link' ) {
				if ( formatValue !== undefined ) {
					const anchor = this.editor.dom.getParent( this.editor.selection.getNode(), 'a' );
					if ( ! anchor ) {
						this.editor.formatter.remove( 'link' );
					}
					this.editor.formatter.apply( 'link', { href: formatValue.value }, anchor );
				} else {
					this.editor.execCommand( 'Unlink' );
				}
			} else {
				const isActive = this.isFormatActive( format );
				if ( isActive && ! formatValue ) {
					this.editor.formatter.remove( format );
				} else if ( ! isActive && formatValue ) {
					this.editor.formatter.apply( format );
				}
			}
		} );

		this.setState( {
			formats: merge( {}, this.state.formats, formats ),
		} );

		this.editor.setDirty( true );
	}

	isAlignmentActive( align ) {
		return this.state.alignment === align;
	}

	toggleAlignment( align ) {
		this.editor.focus();

		if ( this.isAlignmentActive( align ) ) {
			this.editor.execCommand( 'JustifyNone' );
		} else {
			this.editor.execCommand( 'Justify' + capitalize( align ) );
		}
	}

	isListActive( listType ) {
		return this.state.list && this.state.list.type === listType;
	}

	setListType( listType, listCommand ) {
		this.editor.focus();

		if ( this.state.list ) {
			if ( this.state.list.isInternal ) {
				if ( this.state.list.type !== listType ) {
					this.editor.execCommand( listCommand );
				}
			} else if ( this.props.onListChange ) {
				this.props.onListChange( listType );
			}
		}
	}

	render() {
		const {
			tagName,
			style,
			value,
			focus,
			className,
			showAlignments = false,
			inlineToolbar = false,
			inline,
			formattingControls,
			placeholder,
		} = this.props;

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount (+ destroy) the previous TinyMCE element, then
		// mount (+ initialize) a new child element in its place.
		const key = [ 'editor', tagName ].join();
		const classes = classnames( className, 'blocks-editable' );

		const formatToolbar = (
			<FormatToolbar
				focusPosition={ this.state.focusPosition }
				formats={ this.state.formats }
				onChange={ this.changeFormats }
				enabledControls={ formattingControls }
			/>
		);

		return (
			<div className={ classes }>
				{ focus &&
					<Fill name="Formatting.Toolbar">
						{ this.state.list &&
							<Toolbar
								controls={ LIST_CONTROLS.map( ( control ) => ( {
									...control,
									isActive: control.list && this.isListActive( control.list ),
									onClick: () => ( control.list ?
									this.setListType( control.list, control.cmd ) :
									this.editor.execCommand( control.cmd ) ),
								} ) ) }
								/>
						}
						{ showAlignments &&
							<Toolbar
								controls={ ALIGNMENT_CONTROLS.map( ( control ) => ( {
									...control,
									onClick: () => this.toggleAlignment( control.align ),
									isActive: this.isAlignmentActive( control.align ),
								} ) ) } />
						}
						{ ! inlineToolbar && formatToolbar }
					</Fill>
				}

				{ focus && inlineToolbar &&
					<div className="block-editable__inline-toolbar">
						{ formatToolbar }
					</div>
				}

				<TinyMCE
					tagName={ tagName }
					onSetup={ this.onSetup }
					style={ style }
					defaultValue={ value }
					settings={ {
						forced_root_block: inline ? false : 'p',
					} }
					isEmpty={ this.state.empty }
					placeholder={ placeholder }
					key={ key } />
			</div>
		);
	}
}
