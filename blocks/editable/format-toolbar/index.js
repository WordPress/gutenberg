/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Toolbar, withSpokenMessages } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../../url-input';

const { ESCAPE } = keycodes;

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		format: 'italic',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		format: 'strikethrough',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.props.isEditingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	addLink() {
		this.props.onAddLink();
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
	}

	editLink( event ) {
		event.preventDefault();
		this.props.onEditLink();
	}

	submitLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { value: this.props.newLinkValue } } );
		if ( this.props.isAddingLink ) {
			this.props.speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	render() {
		const { formats, focusPosition, isAddingLink, isEditingLink, newLinkValue, enabledControls = DEFAULT_CONTROLS } = this.props;
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
				title: __( 'Link' ),
				onClick: this.addLink,
				isActive: isAddingLink || !! formats.link,
			} );
		}

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ ( isAddingLink || isEditingLink ) &&
					<form
						className="blocks-format-toolbar__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<UrlInput value={ newLinkValue } onChange={ this.props.onChangeLinkValue } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
						<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
					</form>
				}

				{ !! formats.link && ! isAddingLink && ! isEditingLink &&
					<div className="blocks-format-toolbar__link-modal" style={ linkStyle }>
						<a
							className="blocks-format-toolbar__link-value"
							href={ formats.link.value }
							target="_blank"
						>
							{ formats.link.value && decodeURI( formats.link.value ) }
						</a>
						<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
						<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
					</div>
				}
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
