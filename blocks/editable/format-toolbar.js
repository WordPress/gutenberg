/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { IconButton, Toolbar } from 'components';
import { ESCAPE } from 'utils/keycodes';

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
		const newState = {
			linkValue: nextProps.formats.link ? nextProps.formats.link.value : '',
		};
		if (
			! this.props.formats.link ||
			! nextProps.formats.link ||
			this.props.formats.link.node !== nextProps.formats.link.node
		) {
			newState.isEditingLink = false;
		}
		this.setState( newState );
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
	}

	updateLinkValue( event ) {
		this.setState( {
			linkValue: event.target.value,
		} );
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
							placeholder={ __( 'Paste URL or type' ) }
						/>
						<IconButton icon="editor-break" type="submit" />
						<IconButton icon="editor-unlink" onClick={ this.dropLink } />
					</form>
				}

				{ !! formats.link && ! this.state.isEditingLink &&
					<div className="editable-format-toolbar__link-modal" style={ linkStyle }>
						<a className="editable-format-toolbar__link-value" href="" onClick={ this.editLink }>
							{ this.state.linkValue && decodeURI( this.state.linkValue ) }
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
