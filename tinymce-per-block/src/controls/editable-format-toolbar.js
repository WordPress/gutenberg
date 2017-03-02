/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import {
	EditorBoldIcon,
	EditorItalicIcon,
	EditorStrikethroughIcon
} from 'dashicons';

export default class EditableFormatToolbar extends Component {
	state = {
		bold: false,
		italic: false,
		strikethrough: false
	};

	clickToolbarControl = ( control ) => ( event ) => {
		if ( ! this.props.editable ) {
			return;
		}
		event.preventDefault();
		this.props.editable.executeCommand( control, true, ! this.state[ control ] );
	};

	setToolbarState( control, value ) {
		if ( this.state[ control ] === value ) {
			return;
		}
		this.setState( { [ control ]: value } );
	}

	render() {
		const formats = [
			{ id: 'bold', icon: EditorBoldIcon },
			{ id: 'italic', icon: EditorItalicIcon },
			{ id: 'strikethrough', icon: EditorStrikethroughIcon }
		];

		return (
			<div className="block-list__block-toolbar">
				{ formats.map( ( { id, icon: Icon } ) =>
					<button
						key={ id }
						className={ classNames( 'block-list__block-control', {
							'is-selected': this.state[ id ]
						} ) }
						onClick={ this.clickToolbarControl( id ) }
					>
						<Icon />
					</button>
				) }
			</div>
		);
	}
}
