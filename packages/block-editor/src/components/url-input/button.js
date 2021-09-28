/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { link, keyboardReturn, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import URLInput from './';

class URLInputButton extends Component {
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
		const buttonLabel = url ? __( 'Edit link' ) : __( 'Insert link' );

		return (
			<div className="block-editor-url-input__button">
				<Button
					icon={ link }
					label={ buttonLabel }
					onClick={ this.toggle }
					className="components-toolbar__control"
					isPressed={ !! url }
				/>
				{ expanded && (
					<form
						className="block-editor-url-input__button-modal"
						onSubmit={ this.submitLink }
					>
						<div className="block-editor-url-input__button-modal-line">
							<Button
								className="block-editor-url-input__back"
								icon={ arrowLeft }
								label={ __( 'Close' ) }
								onClick={ this.toggle }
							/>
							<URLInput
								value={ url || '' }
								onChange={ onChange }
							/>
							<Button
								icon={ keyboardReturn }
								label={ __( 'Submit' ) }
								type="submit"
							/>
						</div>
					</form>
				) }
			</div>
		);
	}
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-input/README.md
 */
export default URLInputButton;
