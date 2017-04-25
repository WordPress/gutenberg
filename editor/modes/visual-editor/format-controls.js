/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from 'components/icon-button';

class LinkControl extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.state = {
			opened: false
		};
		this.toggleLinkModal = this.toggleLinkModal.bind( this );
		this.submitLinkModal = this.submitLinkModal.bind( this );
		this.updateLinkValue = this.updateLinkValue.bind( this );
	}

	componentWillMount() {
		this.setState( { value: this.props.attributes.link } );
	}

	componentWillReceiveProps( nextProps ) {
		this.setState( { value: nextProps.attributes.link } );
	}

	toggleLinkModal() {
		this.setState( {
			opened: ! this.state.opened
		} );
	}

	submitLinkModal( event ) {
		event.preventDefault();
		this.props.setAttributes( { link: this.state.value } );
		this.setState( {
			opened: false
		} );
	}

	updateLinkValue( event ) {
		this.setState( {
			value: event.target.value
		} );
	}

	render() {
		return (
			<div className="editable-visual-editor__link-control">
				<IconButton
					icon="admin-links"
					label={ wp.i18n.__( 'Link' ) }
					onClick={ this.toggleLinkModal }
					className={ classNames( 'editor-toolbar__control', {
						'is-active': !! this.props.attributes.link
					} ) }
				/>
				{ this.state.opened &&
					<div className="editable-visual-editor__link-modal">
						<form onSubmit={ this.submitLinkModal }>
							<input type="url" value={ this.state.value } onChange={ this.updateLinkValue } />
							<button>{ wp.i18n.__( 'Add Link' ) }</button>
						</form>
					</div>
				}
			</div>
		);
	}
}

const formattingControls = [
	{
		icon: 'editor-bold',
		title: wp.i18n.__( 'Bold' ),
		isActive: ( { bold } ) => !! bold,
		onClick( attributes, setAttributes ) {
			setAttributes( { bold: ! attributes.bold } );
		},
	},
	{
		icon: 'editor-italic',
		title: wp.i18n.__( 'Italic' ),
		isActive: ( { italic } ) => !! italic,
		onClick( attributes, setAttributes ) {
			setAttributes( { italic: ! attributes.italic } );
		},
	},
	{
		icon: 'editor-strikethrough',
		title: wp.i18n.__( 'Strikethrough' ),
		isActive: ( { strikethrough } ) => !! strikethrough,
		onClick( attributes, setAttributes ) {
			setAttributes( { strikethrough: ! attributes.strikethrough } );
		},
	},
	{
		edit: LinkControl
	}
];

export default formattingControls;
