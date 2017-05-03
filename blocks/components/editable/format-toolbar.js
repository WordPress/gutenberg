/**
 * Internal dependencies
 */
 // TODO: We mustn't import by relative path traversing from blocks to editor
 // as we're doing here; instead, we should consider a common components path.
import IconButton from '../../../editor/components/icon-button';
import Toolbar from '../../../editor/components/toolbar';

const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: wp.i18n.__( 'Bold' ),
		format: 'bold'
	},
	{
		icon: 'editor-italic',
		title: wp.i18n.__( 'Italic' ),
		format: 'italic'
	},
	{
		icon: 'editor-strikethrough',
		title: wp.i18n.__( 'Strikethrough' ),
		format: 'strikethrough'
	}
];

class FormatToolbar extends wp.element.Component {
	constructor( props ) {
		super( ...arguments );
		this.state = {
			linkValue: props.formats.link ? props.formats.link.value : '',
			isEditingLink: false
		};
		this.addLink = this.addLink.bind( this );
		this.editLink = this.editLink.bind( this );
		this.dropLink = this.dropLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.updateLinkValue = this.updateLinkValue.bind( this );
	}

	componentWillUnmout() {
		if ( this.editTimeout ) {
			clearTimeout( this.editTimeout );
		}
	}

	componentWillReceiveProps( nextProps ) {
		const newState = {
			linkValue: nextProps.formats.link ? nextProps.formats.link.value : ''
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
				[ format ]: ! this.props.formats[ format ]
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
			isEditingLink: true
		} );
	}

	submitLink( event ) {
		event.preventDefault();
		this.props.onChange( { link: { value: this.state.linkValue } } );
		this.setState( {
			isEditingLink: false
		} );
	}

	updateLinkValue( event ) {
		this.setState( {
			linkValue: event.target.value
		} );
	}

	render() {
		const { formats, focusPosition } = this.props;
		const linkStyle = focusPosition
			? { position: 'absolute', ...focusPosition }
			: null;

		return (
			<div className="editable-format-toolbar">
				<Toolbar
					controls={
						FORMATTING_CONTROLS
							.map( ( control ) => ( {
								...control,
								onClick: this.toggleFormat( control.format ),
								isActive: !! formats[ control.format ]
							} ) )
							.concat( [ {
								icon: 'admin-links',
								title: wp.i18n.__( 'Link' ),
								onClick: this.addLink,
								isActive: !! formats.link
							} ] )
					}
				/>

				{ !! formats.link && this.state.isEditingLink &&
					<form
						className="editable-format-toolbar__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<input
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
							{ decodeURI( this.state.linkValue ) }
						</a>
						<IconButton icon="edit" onClick={ this.editLink } />
						<IconButton icon="editor-unlink" onClick={ this.dropLink } />
					</div>
				}
			</div>
		);
	}
}

export default FormatToolbar;
