/**
 * External dependencies
 */
import classnames from 'classnames';
import { last, isEqual, capitalize, omitBy, forEach, merge, drop, pick, compact } from 'lodash';
import { nodeListToReact } from 'dom-react';
import { Fill } from 'react-slot-fill';
import 'element-closest';

const { tinymce } = window;

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

const alignmentMap = {
	alignleft: 'left',
	alignright: 'right',
	aligncenter: 'center'
};

const ALIGNMENT_CONTROLS = [
	{
		icon: 'editor-alignleft',
		title: wp.i18n.__( 'Align left' ),
		align: 'left'
	},
	{
		icon: 'editor-aligncenter',
		title: wp.i18n.__( 'Align center' ),
		align: 'center'
	},
	{
		icon: 'editor-alignright',
		title: wp.i18n.__( 'Align right' ),
		align: 'right'
	}
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
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.changeFormats = this.changeFormats.bind( this );

		this.state = {
			formats: {},
			alignment: null
		};

		this.content = props.value;
		this.selection = {
			start: [],
			end: [],
			isCollapsed: true
		};
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'selectionChange', this.onSelectionChange );
	}

	onInit() {
		this.maybeFocus();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();
	}

	isActive() {
		return tinymce.EditorManager.activeEditor.id === this.editor.id;
	}

	onSelectionChange() {
		// We must check this because selectionChange is a global event.
		if ( ! this.isActive() ) {
			return;
		}

		this.content = this.getContent();
		this.selection = this.getSelection();

		if ( ! this.props.onChange ) {
			return;
		}

		if ( ! isEqual( this.props.value, this.content ) ) {
			this.props.onChange( this.content );
		}
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
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left
		};
	}

	isStartOfEditor() {
		return this.selection.isCollapsed && ! compact( this.selection.start ).length;
	}

	onKeyDown( event ) {
		if ( this.props.onMerge && event.keyCode === KEYCODE_BACKSPACE && this.isStartOfEditor() ) {
			this.props.onMerge( this.content );
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	onNewBlock() {
		if ( this.props.tagName || ! this.props.onSplit ) {
			return;
		}

		if ( ! this.content.length > 1 ) {
			return;
		}

		if ( ! this.selection.isCollapsed || ! this.selection.start.length ) {
			return;
		}

		const index = this.selection.start[ 0 ];

		if ( compact( drop( this.selection.start ) ).length ) {
			return;
		}

		this.props.onSplit(
			this.content.slice( 0, index ),
			this.content.slice( index )
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

		const focusPosition = this.getRelativePosition( element );
		this.setState( { alignment, formats, focusPosition } );
	}

	getChildIndex( child ) {
		return Array.from( child.parentNode.childNodes ).indexOf( child );
	}

	getSelection() {
		const range = this.editor.selection.getRng();
		let startNode = this.editor.selection.getStart();
		let endNode = this.editor.selection.getEnd();
		const isCollapsed = this.editor.selection.isCollapsed();
		const rootNode = this.editor.getBody();
		const start = [];
		const end = [];

		if ( range.startContainer !== rootNode ) {
			start.push( range.startOffset );
		}

		if ( range.endContainer !== rootNode ) {
			end.push( range.endOffset );
		}

		if ( range.startContainer.nodeType === 3 ) {
			startNode = range.startContainer;
		}

		if ( range.endContainer.nodeType === 3 ) {
			endNode = range.endContainer;
		}

		while ( startNode !== rootNode ) {
			start.unshift( this.getChildIndex( startNode ) );
			startNode = startNode.parentNode;
		}

		while ( endNode !== rootNode ) {
			end.unshift( this.getChildIndex( endNode ) );
			endNode = endNode.parentNode;
		}

		return { start, end, isCollapsed };
	}

	findNodeWithPath( path, rootNode ) {
		const index = path[ 0 ];

		if ( index === undefined || ! rootNode.hasChildNodes() ) {
			return;
		}

		const node = rootNode.childNodes[ index ];

		if ( ! node || node.nodeType === 3 ) {
			return;
		}

		const newPath = drop( path );

		if ( newPath.length ) {
			return this.findNodeWithPath( newPath, node );
		}

		return node;
	}

	setSelection( { start, end } ) {
		if ( ! start.length ) {
			return;
		}

		const rootNode = this.editor.getBody();

		let startNode = this.findNodeWithPath( start, rootNode ) || rootNode.firstChild;
		let endNode = this.findNodeWithPath( end, rootNode ) || rootNode.firstChild;
		let startOffset = 0;
		let endOffset = 0;

		const range = this.editor.dom.createRng();
		const currentRange = this.editor.selection.getRng();

		if ( startNode.nodeType === 3 ) {
			startOffset = last( start );
		} else {
			startOffset = this.getChildIndex( startNode );
			startNode = startNode.parentNode;
		}

		if ( endNode.nodeType === 3 ) {
			endOffset = last( end );
		} else {
			endOffset = this.getChildIndex( endNode ) + 1;
			endNode = endNode.parentNode;
		}

		range.setStart( startNode, startOffset );
		range.setEnd( endNode, endOffset );

		const propsToCompare = [
			'startOffset', 'endOffset',
			'startContainer', 'endContainer'
		];

		if ( ! isEqual( pick( currentRange, propsToCompare ), pick( range, propsToCompare ) ) ) {
			this.editor.selection.lastFocusBookmark = null;
			this.editor.selection.setRng( range );
		} else if ( document.activeElement !== rootNode ) {
			this.editor.focus();
		}
	}

	setContent( content ) {
		this.editor.setContent( wp.element.renderToString( content || '' ) );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createElement );
	}

	maybeFocus() {
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

	componentDidUpdate( prevProps ) {
		if ( this.props.focus !== prevProps.focus ) {
			this.maybeFocus();
		}

		if ( this.props.tagName !== prevProps.tagName ) {
			this.setSelection( this.selection );
		}

		if ( this.props.onChange && ! isEqual( this.props.value, this.content ) ) {
			this.setContent( this.props.value );
			this.setSelection( this.selection );
		}
	}

	isFormatActive( format ) {
		return !! this.state.formats[ format ];
	}

	changeFormats( formats ) {
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
			formats: merge( {}, this.state.formats, formats )
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

	isEmpty( value ) {
		// Empty array.
		if ( ! value.length ) {
			return true;
		}

		const props = value[ 0 ].props;

		// Empty string.
		if ( ! props && ! value[ 0 ].length ) {
			return true;
		}

		// Empty React Object.
		if ( props && props.children && ! props.children.length ) {
			return true;
		}

		return false;
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
			placeholder
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
						{ showAlignments &&
							<Toolbar
								controls={ ALIGNMENT_CONTROLS.map( ( control ) => ( {
									...control,
									onClick: () => this.toggleAlignment( control.align ),
									isActive: this.isAlignmentActive( control.align )
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
						forced_root_block: inline ? false : 'p'
					} }
					isEmpty={ String( this.isEmpty( value ) ) }
					placeholder={ placeholder }
					key={ key } />
			</div>
		);
	}
}
