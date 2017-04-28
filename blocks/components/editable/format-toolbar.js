/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
 // TODO: We mustn't import by relative path traversing from blocks to editor
 // as we're doing here; instead, we should consider a common components path.
import IconButton from '../../../editor/components/icon-button';

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
		return ( event ) => {
			event.stopPropagation();
			this.props.onChange( {
				[ format ]: ! this.props.formats[ format ]
			} );
		};
	}

	addLink() {
		if ( ! this.props.formats.link ) {
			// TODO find a way to add an empty link to TinyMCE
			this.props.onChange( { link: { value: 'http://wordpress.org' } } );

			// Debounce the call to avoid the reset in willReceiveProps
			setTimeout( () => this.setState( { isEditingLink: true } ) );
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
				<ul className="editor-toolbar">
					{ FORMATTING_CONTROLS.map( ( control, index ) => (
						<IconButton
							key={ index }
							icon={ control.icon }
							label={ control.title }
							onClick={ this.toggleFormat( control.format ) }
							className={ classNames( 'editor-toolbar__control', {
								'is-active': !! formats[ control.format ]
							} ) } />
					) ) }
					<IconButton
						icon="admin-links"
						label={ wp.i18n.__( 'Link' ) }
						onClick={ this.addLink }
						className={ classNames( 'editor-toolbar__control', {
							'is-active': !! formats.link
						} ) }
					/>
				</ul>

				{ !! formats.link && this.state.isEditingLink &&
					<form
						className="editable-format-toolbr__link-modal"
						style={ linkStyle }
						onSubmit={ this.submitLink }>
						<input
							type="url"
							value={ this.state.linkValue }
							onChange={ this.updateLinkValue }
						/>
						<IconButton icon="editor-break" type="submit" />
					</form>
				}

				{ !! formats.link && ! this.state.isEditingLink &&
					<div className="editable-format-toolbr__link-modal" style={ linkStyle }>
						<a href="" onClick={ this.editLink }>
							{ decodeURI( this.state.linkValue ) }
						</a>
						<IconButton icon="edit" onClick={ this.editLink } />
						<IconButton icon="trash" onClick={ this.dropLink } />
					</div>
				}
			</div>
		);
	}
}

export default FormatToolbar;
