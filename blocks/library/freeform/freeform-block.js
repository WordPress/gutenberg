/**
 * External dependencies
 */
import classnames from 'classnames';
import { nodeListToReact } from 'dom-react';
import 'element-closest';
import { concat, find, flatten, isEqual, omitBy, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createElement, renderToString, findDOMNode } from 'element';
import { __ } from 'i18n';
import { Toolbar } from 'components';

/**
 * Internal dependencies
 */
import './freeform-block.scss';
import TinyMCE from '../../editable/tinymce';
import BlockControls from '../../block-controls';
import FormatList from './format-list';

const BLOCK_CONTROLS_SELECTOR = '.editor-visual-editor__block-controls';

const ALIGNMENT_CONTROLS = [
	{
		id: 'alignleft',
		icon: 'editor-alignleft',
		title: __( 'Align left' ),
	},
	{
		id: 'aligncenter',
		icon: 'editor-aligncenter',
		title: __( 'Align center' ),
	},
	{
		id: 'alignright',
		icon: 'editor-alignright',
		title: __( 'Align right' ),
	},
];

const FREEFORM_CONTROLS = [
	[
		{
			id: 'blockquote',
			icon: 'editor-quote',
			title: __( 'Quote' ),
		},
		{
			id: 'bullist',
			icon: 'editor-ul',
			title: __( 'Convert to unordered' ),
		},
		{
			id: 'numlist',
			icon: 'editor-ol',
			title: __( 'Convert to ordered' ),
		},
	],
	[
		{
			id: 'bold',
			icon: 'editor-bold',
			title: __( 'Bold' ),
		},
		{
			id: 'italic',
			icon: 'editor-italic',
			title: __( 'Italic' ),
		},
		{
			id: 'strikethrough',
			icon: 'editor-strikethrough',
			title: __( 'Strikethrough' ),
		},
	],
];
const MORE_CONTROLS = [
	{
		id: 'indent',
		icon: 'editor-indent',
		title: __( 'Indent' ),
	},
	{
		id: 'outdent',
		icon: 'editor-outdent',
		title: __( 'Outdent' ),
	},
];

const MORE_DRAWER_HEIGHT = 40;

function createTinyMCEElement( type, props, ...children ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return children;
	}

	return createElement(
		type,
		omitBy( props, ( value, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...children
	);
}

export default class FreeformBlock extends Component {
	constructor( props ) {
		super( ...arguments );
		this.getSettings = this.getSettings.bind( this );
		this.setButtonActive = this.setButtonActive.bind( this );
		this.setButtonDisabled = this.setButtonDisabled.bind( this );
		this.setFormatActive = this.setFormatActive.bind( this );
		this.toggleMoreDrawer = this.toggleMoreDrawer.bind( this );
		this.setToolbarRef = this.setToolbarRef.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onInit = this.onInit.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onScroll = throttle( this.onScroll.bind( this ), 250 );
		this.isEndOfEditor = this.isEndOfEditor.bind( this );
		this.updateFocus = this.updateFocus.bind( this );
		this.updateContent = this.updateContent.bind( this );
		this.setContent = this.setContent.bind( this );
		this.getContent = this.getContent.bind( this );
		this.mapControls = this.mapControls.bind( this );
		this.editor = null;
		this.toolbarElem = null;
		this.savedContent = null;
		this.formats = null;
		this.handleFormatChange = null;
		this.state = {
			empty: ! props.value || ! props.value.length,
			activeButtons: { },
			disabledButtons: { },
			activeFormat: null,
			showMore: false,
			expandDown: false,
		};
	}

	getSettings( baseSettings ) {
		return {
			...baseSettings,
			plugins: ( baseSettings.plugins || [] ).concat( 'lists' ),
		};
	}

	setButtonActive( id, active ) {
		this.setState( ( prevState ) => ( {
			activeButtons: {
				...prevState.activeButtons,
				[ id ]: active,
			},
		} ) );
	}

	setButtonDisabled( id, disabled ) {
		this.setState( ( prevState ) => ( {
			disabledButtons: {
				...prevState.disabledButtons,
				[ id ]: disabled,
			},
		} ) );
	}

	setFormatActive( newActiveFormat ) {
		this.setState( { activeFormat: newActiveFormat } );
	}

	toggleMoreDrawer() {
		this.setState( { showMore: ! this.state.showMore } );
	}

	setToolbarRef( elem ) {
		this.toolbarElem = elem;
		this.onScroll();
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'selectionChange', this.onSelectionChange );
	}

	onInit() {
		const formatselect = this.editor.buttons.formatselect();
		formatselect.onPostRender.call( {
			value: this.setFormatActive,
		} );
		this.formats = formatselect.values;
		this.handleFormatChange = formatselect.onselect;
		this.forceUpdate();

		[ ...ALIGNMENT_CONTROLS, ...flatten( FREEFORM_CONTROLS ), ...MORE_CONTROLS ].forEach( ( control ) => {
			if ( control.id ) {
				const button = this.editor.buttons[ control.id ];
				// TinyMCE uses the first 2 cases, I am not sure about the third.
				const fnNames = [ 'onPostRender', 'onpostrender', 'OnPostRender' ];
				const onPostRender = find( fnNames, ( fn ) => button.hasOwnProperty( fn ) );
				if ( onPostRender ) {
					button[ onPostRender ].call( {
						active: ( isActive ) => this.setButtonActive( control.id, isActive ),
					}, { control: {
						disabled: ( isDisabled ) => this.setButtonDisabled( control.id, isDisabled ),
					} } );
				}
			}
		} );
		this.updateFocus();
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
		const collapsed = this.editor.selection.isCollapsed();

		this.setState( {
			empty: ! content || ! content.length,
		} );

		if (
			this.props.focus && this.props.onFocus &&
			this.props.focus.collapsed !== collapsed
		) {
			this.props.onFocus( {
				...this.props.focus,
				collapsed,
			} );
		}
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	onFocus() {
		if ( this.props.onFocus ) {
			this.props.onFocus();
		}
	}

	onScroll() {
		if ( this.toolbarElem ) {
			const n = findDOMNode( this.toolbarElem );
			const blockControls = n ? n.closest( BLOCK_CONTROLS_SELECTOR ) : null;
			if ( blockControls ) {
				const currentTop = blockControls.getBoundingClientRect().top;
				const stickyTop = parseInt( window.getComputedStyle( blockControls ).top, 10 );
				const expandDown = currentTop - stickyTop <= MORE_DRAWER_HEIGHT;
				this.setState( { expandDown } );
			}
		}
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

	updateFocus() {
		const { focus } = this.props;
		const isActive = this.isActive();

		if ( focus ) {
			if ( ! isActive ) {
				this.editor.focus();
			}

			// Offset = -1 means we should focus the end of the editable
			if ( focus.offset === -1 && ! this.isEndOfEditor() ) {
				this.editor.selection.select( this.editor.getBody(), true );
				this.editor.selection.collapse( false );
			}
		} else if ( isActive ) {
			this.editor.getBody().blur();
		}
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

		content = renderToString( content );
		this.editor.setContent( content, { format: 'raw' } );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createTinyMCEElement );
	}

	mapControls( controls ) {
		return controls.map( ( control ) => {
			if ( Array.isArray( control ) ) {
				return this.mapControls( control );
			}

			return {
				...control,
				onClick: () => this.editor && this.editor.buttons[ control.id ].onclick(),
				isActive: this.state.activeButtons[ control.id ],
				isDisabled: this.state.disabledButtons[ control.id ],
			};
		} );
	}

	componentDidMount() {
		window.addEventListener( 'scroll', this.onScroll );
	}

	componentWillUnmount() {
		this.onChange();
		window.removeEventListener( 'scroll', this.onScroll );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focus !== prevProps.focus ) {
			this.updateFocus();
		}

		// The `savedContent` var allows us to avoid updating the content right after an `onChange` call
		if (
			this.props.content !== prevProps.content &&
			this.props.content !== this.savedContent &&
			! isEqual( this.props.content, prevProps.content ) &&
			! isEqual( this.props.content, this.savedContent )
		) {
			this.updateContent();
		}
	}

	render() {
		const { content, focus, className } = this.props;
		const { expandDown, showMore } = this.state;
		const moreDrawerClasses = classnames( 'more-drawer', expandDown ? 'down' : 'up' );
		return [
			focus && <BlockControls key="controls">
				<FormatList
					onFormatChange={ this.handleFormatChange }
					formats={ this.formats }
					value={ this.state.activeFormat }
					ref={ this.setToolbarRef }
				/>
				<Toolbar controls={ this.mapControls( ALIGNMENT_CONTROLS ) } />
				<Toolbar
					controls={ concat( this.mapControls( FREEFORM_CONTROLS ), [ [ {
						icon: 'ellipsis',
						title: __( 'More' ),
						isActive: showMore,
						onClick: this.toggleMoreDrawer,
						children: (
							showMore && <div className={ moreDrawerClasses }>
								<div className="more-draw__arrow" />
								<Toolbar controls={ this.mapControls( MORE_CONTROLS ) } />
							</div>
						),
					} ] ] ) }
				/>
			</BlockControls>,
			<TinyMCE
				key="editor"
				className={ className }
				getSettings={ this.getSettings }
				onSetup={ this.onSetup }
				defaultValue={ content }
				isEmpty={ this.state.empty }
			/>,
		];
	}
}
