/**
 * External dependencies
 */
import { forEach, merge } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import IconButton from 'components/icon-button';
import Toolbar from 'components/toolbar';

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: wp.i18n.__( 'Bold' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: wp.i18n.__( 'Italic' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: wp.i18n.__( 'Strikethrough' ),
		format: 'strikethrough',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			linkValue: '',
			isEditingLink: false,
			formats: {},
			bookmark: null,
		};
		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.updateLinkValue = this.updateLinkValue.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
	}

	componentWillMount() {
		this.props.editor.on( 'nodechange', this.onNodeChange );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.editor !== this.props.editor ) {
			this.props.editor.off( 'nodechange', this.onNodeChange );
			nextProps.editor.on( 'nodechange', this.onNodeChange );
		}
	}

	getRelativePosition( node ) {
		// Todo: Find a better way to compute the position

		const position = node.getBoundingClientRect();

		// Find the parent "relative" positioned container
		const container = this.props.inline
			? this.props.editor.getBody().closest( '.blocks-editable' )
			: this.props.editor.getBody().closest( '.editor-visual-editor__block' );
		const containerPosition = container.getBoundingClientRect();
		const blockPadding = 14;
		const blockMoverMargin = 18;

		// These offsets are necessary because the toolbar where the link modal lives
		// is absolute positioned and it's not shown when we compute the position here
		// so we compute the position about its parent relative position and adds the offset
		const toolbarOffset = this.props.inline
			? { top: 50, left: 0 }
			: { top: 40, left: -( ( blockPadding * 2 ) + blockMoverMargin ) };
		const linkModalWidth = 250;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	onNodeChange( { element, parents } ) {
		const formats = {};
		const link = parents.find( ( node ) => node.nodeName.toLowerCase() === 'a' );
		if ( link ) {
			formats.link = { value: link.getAttribute( 'href' ), link };
		}
		const activeFormats = this.props.editor.formatter.matchAll( [	'bold', 'italic', 'strikethrough' ] );
		activeFormats.forEach( ( activeFormat ) => formats[ activeFormat ] = true );

		const focusPosition = this.getRelativePosition( element );
		const bookmark = this.props.editor.selection.getBookmark( 2, true );
		this.setState( {
			bookmark,
			formats,
			focusPosition,
			linkValue: '',
		} );
	}

	isFormatActive( format ) {
		return !! this.state.formats[ format ];
	}

	changeFormats( formats ) {
		const editor = this.props.editor;

		if ( this.state.bookmark ) {
			editor.selection.moveToBookmark( this.state.bookmark );
		}

		forEach( formats, ( formatValue, format ) => {
			if ( format === 'link' ) {
				if ( formatValue !== undefined ) {
					const anchor = editor.dom.getParent( editor.selection.getNode(), 'a' );
					if ( ! anchor ) {
						editor.formatter.remove( 'link' );
					}
					editor.formatter.apply( 'link', { href: formatValue.value }, anchor );
				} else {
					editor.execCommand( 'Unlink' );
				}
			} else {
				const isActive = this.isFormatActive( format );
				if ( isActive && ! formatValue ) {
					editor.formatter.remove( format );
				} else if ( ! isActive && formatValue ) {
					editor.formatter.apply( format );
				}
			}
		} );

		this.setState( {
			formats: merge( {}, this.state.formats, formats ),
		} );

		editor.setDirty( true );
	}

	toggleFormat( format ) {
		return () => {
			this.changeFormats( {
				[ format ]: ! this.state.formats[ format ],
			} );
		};
	}

	addLink() {
		if ( ! this.state.formats.link ) {
			this.changeFormats( { link: { value: '' } } );
			this.setState( { isEditingLink: true } );
		}
	}

	dropLink() {
		this.changeFormats( { link: undefined } );
		this.setState( { isEditingLink: false } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( {
			isEditingLink: true,
			linkValue: this.state.formats.link.value,
		} );
	}

	submitLink( event ) {
		event.preventDefault();
		this.changeFormats( { link: { value: this.state.linkValue } } );
		this.setState( {
			isEditingLink: false,
		} );
	}

	updateLinkValue( event ) {
		this.setState( {
			linkValue: event.target.value,
		} );
	}

	render() {
		const { enabledControls = DEFAULT_CONTROLS } = this.props;
		const { formats, focusPosition } = this.state;
		const linkStyle = focusPosition
			? { position: 'absolute', ...focusPosition }
			: null;

		const toolbarControls = FORMATTING_CONTROLS
			.filter( control => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => ( {
				...control,
				onClick: this.toggleFormat( control.format ),
				isActive: !! formats[ control.format ],
			} ) );

		if ( enabledControls.indexOf( 'link' ) !== -1 ) {
			toolbarControls.push( {
				icon: 'admin-links',
				title: wp.i18n.__( 'Link' ),
				onClick: this.addLink,
				isActive: !! formats.link,
			} );
		}

		/* eslint-disable jsx-a11y/no-autofocus */
		return (
			<div className="editable-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ !! formats.link && this.state.isEditingLink &&
					<form
						className="editable-format-toolbar__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<input
							autoFocus
							className="editable-format-toolbar__link-input"
							type="url"
							required
							value={ this.state.linkValue }
							onChange={ this.updateLinkValue }
							placeholder={ wp.i18n.__( 'Paste URL or type' ) }
						/>
						<IconButton icon="editor-break" type="submit" />
					</form>
				}

				{ !! formats.link && ! this.state.isEditingLink &&
					<div className="editable-format-toolbar__link-modal" style={ linkStyle }>
						<a className="editable-format-toolbar__link-value" href="" onClick={ this.editLink }>
							{ !! formats.link.value && decodeURI( formats.link.value ) }
						</a>
						<IconButton icon="edit" onClick={ this.editLink } />
						<IconButton icon="editor-unlink" onClick={ this.dropLink } />
					</div>
				}
			</div>
		);
		/* eslint-enable jsx-a11y/no-autofocus */
	}
}

export default FormatToolbar;
