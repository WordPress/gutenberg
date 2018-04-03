/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import UrlInput from './';

// Stop the key event propagating when start typing in URLInput.
const stopKeyPropagation = ( event ) => event.stopPropagation();

class UrlInputButton extends Component {
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
		const buttonLabel = url ? __( 'Edit Link' ) : __( 'Insert Link' );

		return (
			<div className="blocks-url-input__button">
				<IconButton
					icon="admin-links"
					label={ buttonLabel }
					onClick={ this.toggle }
					className={ classnames( 'components-toolbar__control', {
						'is-active': url,
					} ) }
				/>
				{ expanded &&
					// Disable reason: KeyPress & KeyDown must be suppressed so the input changes doesn't close the URLInput block.
					/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
					<form
						className="blocks-format-toolbar__link-modal"
						onKeyPress={ stopKeyPropagation }
						onKeyDown={ stopKeyPropagation }
						onSubmit={ this.submitLink }>
						<div className="blocks-format-toolbar__link-modal-line">
							<IconButton
								className="blocks-url-input__back"
								icon="arrow-left-alt"
								label={ __( 'Close' ) }
								onClick={ this.toggle }
							/>
							<UrlInput value={ url || '' } onChange={ onChange } data-test="UrlInput" />
							<IconButton
								icon="editor-break"
								label={ __( 'Submit' ) }
								type="submit"
							/>
						</div>
					</form>
				}
			</div>
		);
	}
}

export default UrlInputButton;
