/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { IconButton } from 'components';

class UrlInput extends Component {
	constructor() {
		super( ...arguments );
		this.expand = this.expand.bind( this );
		this.state = {
			expanded: false,
		};
	}

	expand() {
		this.setState( { expanded: true } );
	}

	render() {
		const { url, onChange } = this.props;
		const { expanded } = this.state;

		return (
			<div>
				<IconButton icon="admin-links" onClick={ this.expand } />
				{ ( expanded || url ) &&
					<form
						className="editable-format-toolbar__link-modal"
						onSubmit={ ( event ) => event.preventDefault() }>
						<input
							className="editable-format-toolbar__link-input"
							type="url"
							required
							value={ url }
							onChange={ onChange }
							placeholder={ __( 'Paste URL or type' ) }
						/>
						<IconButton icon="editor-break" type="submit" />
					</form>
				}
			</div>
		);
	}
}

export default UrlInput;
