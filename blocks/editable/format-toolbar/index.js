/**
 * External dependencies
 */
import { isUndefined } from 'lodash';

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
	constructor( props ) {
		super( ...arguments );
		this.state = {
			linkValue: props.formats.link ? props.formats.link.value : '',
			isEditingLink: false,
		};
		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.updateLinkValue = this.updateLinkValue.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmout() {
		if ( this.editTimeout ) {
			clearTimeout( this.editTimeout );
		}
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			if ( this.state.isEditingLink ) {
				event.stopPropagation();
				this.dropLink();
			}
		}
	}

	componentWillReceiveProps( nextProps ) {
		// Update the link value if the focused link node changes
		if (
			isUndefined( nextProps.formats.link ) !== isUndefined( this.props.formats.link ) ||
			(
				nextProps.formats.link && this.props.formats.link &&
				nextProps.formats.link.node !== this.props.formats.link.node
			)
		) {
			this.setState( {
				linkValue: nextProps.formats.link ? nextProps.formats.link.value : '',
				isEditingLink: false,
			} );
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
		if ( ! this.props.formats.link ) {
			this.props.onChange( { link: { value: '' } } );

			// Debounce the call to avoid the reset in willReceiveProps
			this.editTimeout = setTimeout( () => this.setState( { isEditingLink: true } ) );
		}
	}

	dropLink() {
		this.props.onChange( { link: undefined } );
	}

	editLink( event ) {
		event.preventDefault();
		this.setState( {
			isEditingLink: true,
		} );
	}

	submitLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { value: this.state.linkValue } } );
		this.setState( {
			isEditingLink: false,
		} );
		if (
			this.props.formats.link.value === '' &&
			!! this.state.linkValue.length
		) {
			this.props.speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	updateLinkValue( linkValue ) {
		this.setState( { linkValue } );
	}

	render() {
		const { formats, focusPosition, enabledControls = DEFAULT_CONTROLS } = this.props;
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
				isActive: !! formats.link,
			} );
		}

		return (
			<div className="blocks-format-toolbar">
				<Toolbar controls={ toolbarControls } />

				{ !! formats.link && this.state.isEditingLink &&
					<form
						className="blocks-format-toolbar__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<UrlInput value={ this.state.linkValue } onChange={ this.updateLinkValue } />
						<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
						<IconButton icon="editor-unlink" label={ __( 'Remove link' ) } onClick={ this.dropLink } />
					</form>
				}

				{ !! formats.link && ! this.state.isEditingLink &&
					<div className="blocks-format-toolbar__link-modal" style={ linkStyle }>
						<a
							className="blocks-format-toolbar__link-value"
							href={ this.state.linkValue }
							target="_blank"
						>
							{ this.state.linkValue && decodeURI( this.state.linkValue ) }
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
