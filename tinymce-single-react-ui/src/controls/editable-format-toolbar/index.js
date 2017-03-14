/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import {
	EditorBoldIcon,
	EditorItalicIcon,
	EditorStrikethroughIcon,
	AdminLinksIcon
} from 'dashicons';

export default class EditableFormatToolbar extends Component {
	state = {
		controls: {
			bold: false,
			italic: false,
			strikethrough: false,
			link: ''
		},
		linkModal: {
			open: false,
			value: ''
		}
	};

	clickToolbarControl = ( control ) => ( event ) => {
		if ( ! this.props.editable ) {
			return;
		}
		event.preventDefault();
		this.props.editable.executeCommand( control, true, ! this.state[ control ] );
	};

	setToolbarState( control, value ) {
		if ( this.state.controls[ control ] === value ) {
			return;
		}
		if ( control === 'link' && this.state.controls.link !== value ) {
			this.setState( {
				linkModal: {
					open: this.state.linkModal.open,
					value
				}
			} );
		}
		this.setState( {
			controls: Object.assign( {}, this.state.controls, {
				[ control ]: value
			} )
		}	);
	}

	toggleLinkModal = () => {
		this.setState( {
			linkModal: {
				open: ! this.state.linkModal.open,
				value: this.state.controls.link
			}
		} );
	};

	submitLinkModal = ( event ) => {
		event.preventDefault();
		this.props.editable && this.props.editable.executeCommand( 'mceInsertLink', true, this.state.linkModal.value );
		this.setState( {
			linkModal: {
				open: false,
				value: this.state.controls.link
			}
		} );
	};

	updateLinkValue = ( event ) => {
		this.setState( {
			linkModal: {
				open: true,
				value: event.target.value
			}
		} );
	}

	render() {
		const formats = [
			{ id: 'bold', icon: EditorBoldIcon, onClick: this.clickToolbarControl( 'bold' ) },
			{ id: 'italic', icon: EditorItalicIcon, onClick: this.clickToolbarControl( 'italic' ) },
			{ id: 'strikethrough', icon: EditorStrikethroughIcon,
				onClick: this.clickToolbarControl( 'strikethrough' )
			},
			{ id: 'link', icon: AdminLinksIcon, onClick: this.toggleLinkModal }
		];

		return (
			<div className="editable-format-toolbar block-list__block-toolbar">
				{ formats.map( ( { id, icon: Icon, onClick } ) =>
					<button
						key={ id }
						className={ classNames( 'block-list__block-control', {
							'is-selected': !! this.state.controls[ id ]
						} ) }
						onClick={ onClick }
					>
						<Icon />
					</button>
				) }
				{ this.state.linkModal.open &&
					<div className="controls__link-modal">
						<form onSubmit={ this.submitLinkModal }>
							<input type="url" value={ this.state.linkModal.value } onChange={ this.updateLinkValue } />
							<button>Add Link</button>
						</form>
					</div>
				}
			</div>
		);
	}
}
