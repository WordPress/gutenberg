/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Toolbar, withSpokenMessages, Fill } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import UrlInput from '../../url-input';
import { filterURLForDisplay } from '../../../editor/utils/url';

const { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } = keycodes;

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
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		format: 'link',
	},
];

// Default controls shown if no `enabledControls` prop provided
const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link' ];

// Stop the key event from propagating up to maybeStartTyping in BlockListBlock
const stopKeyPropagation = ( event ) => event.stopPropagation();

class FormatToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			isAddingLink: false,
			isEditingLink: false,
			newLinkValue: '',
		};

		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeLinkValue = this.onChangeLinkValue.bind( this );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.state.isEditingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			stopKeyPropagation( event );
		}
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.selectedNodeId !== nextProps.selectedNodeId ) {
			this.setState( {
				isAddingLink: false,
				isEditingLink: false,
				newLinkValue: '',
			} );
		}
	}

	onChangeLinkValue( value ) {
		this.setState( { newLinkValue: value } );
	}

	toggleFormat( format ) {
		return () => {
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ],
			} );
		};
	}

	addLink() {
		this.setState( { isEditingLink: false, isAddingLink: true, newLinkValue: '' } );
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
		this.setState( { isEditingLink: false, isAddingLink: false, newLinkValue: '' } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( { isEditingLink: false, isAddingLink: true, newLinkValue: this.props.formats.link.value } );
	}

	submitLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { value: this.state.newLinkValue } } );
		if ( this.state.isAddingLink ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}
	}

	isFormatActive( format ) {
		return this.props.formats[ format ] && this.props.formats[ format ].isActive;
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS, customControls = [] } = this.props;
		const { isAddingLink, isEditingLink, newLinkValue } = this.state;
		const linkStyle = focusPosition ?
			{ position: 'absolute', ...focusPosition } :
			null;

		const toolbarControls = FORMATTING_CONTROLS.concat( customControls )
			.filter( control => enabledControls.indexOf( control.format ) !== -1 )
			.map( ( control ) => {
				const isLink = control.format === 'link';
				return {
					...control,
					onClick: isLink ? this.addLink : this.toggleFormat( control.format ),
					isActive: this.isFormatActive( control.format ) || ( isLink && isAddingLink ),
				};
			} );

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ ( isAddingLink || isEditingLink ) &&
					// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
					/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
					<Fill name="RichText.Siblings">
						<form
							className="blocks-format-toolbar__link-modal"
							style={ linkStyle }
							onKeyPress={ stopKeyPropagation }
							onKeyDown={ this.onKeyDown }
							onSubmit={ this.submitLink }>
							<div className="blocks-format-toolbar__link-modal-line">
								<UrlInput value={ newLinkValue } onChange={ this.onChangeLinkValue } />
								<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
								<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
							</div>
						</form>
					</Fill>
					/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
				}

				{ !! formats.link && ! isAddingLink && ! isEditingLink &&
					// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
					/* eslint-disable jsx-a11y/no-static-element-interactions */
					<Fill name="RichText.Siblings">
						<div
							className="blocks-format-toolbar__link-modal"
							style={ linkStyle }
							onKeyPress={ stopKeyPropagation }
						>
							<div className="blocks-format-toolbar__link-modal-line">
								<a
									className="blocks-format-toolbar__link-value"
									href={ formats.link.value }
									target="_blank"
								>
									{ formats.link.value && filterURLForDisplay( decodeURI( formats.link.value ) ) }
								</a>
								<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ this.editLink } />
								<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
							</div>
						</div>
					</Fill>
					/* eslint-enable jsx-a11y/no-static-element-interactions */
				}
			</div>
		);
	}
}

export default withSpokenMessages( FormatToolbar );
