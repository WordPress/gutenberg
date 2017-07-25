/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import './style.scss';
import { __ } from 'i18n';
import { Component } from 'element';
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import LinkInput from '../editable/format-toolbar/link-input';

class UrlInput extends Component {
	constructor() {
		super( ...arguments );
		this.toggle = this.toggle.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.state = {
			expanded: false,
		};
	}

	toggle() {
		this.setState( { expanded: ! this.state.expanded } );
	}

	submitLink( event ) {
		event.preventDefault();
		this.toggle();
	}

	render() {
		const { url, onChange } = this.props;
		const { expanded } = this.state;

		return (
			<li className="components-url-input">
				<IconButton
					icon="admin-links"
					label={ __( 'Edit Image Link' ) }
					onClick={ this.toggle }
					className={ classnames( 'components-toolbar__control', {
						'is-active': url,
					} ) }
				/>
				{ expanded &&
					<form
						className="blocks-format-toolbar__link-modal"
						onSubmit={ this.submitLink }>
						<IconButton
							className="components-url-input__back"
							icon="arrow-left-alt"
							label={ __( 'Close' ) }
							onClick={ this.toggle }
						/>
						<LinkInput value={ url || '' } onChange={ onChange } />
						<IconButton
							icon="editor-break"
							label={ __( 'Submit' ) }
							type="submit"
						/>
					</form>
				}
			</li>
		);
	}
}

export default UrlInput;
