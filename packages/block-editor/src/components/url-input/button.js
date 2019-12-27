/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';

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
					icon="admin-links"
					label={ buttonLabel }
					onClick={ this.toggle }
					className="components-toolbar__control"
					isPressed={ !! url }
				/>
				{ expanded &&
					<form
						className="block-editor-url-input__button-modal"
						onSubmit={ this.submitLink }
					>
						<div className="block-editor-url-input__button-modal-line">
							<Button
								className="block-editor-url-input__back"
								icon="arrow-left-alt"
								label={ __( 'Close' ) }
								onClick={ this.toggle }
							/>
							<URLInput value={ url || '' } onChange={ onChange } />
							<Button
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

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/url-input/README.md
 */
export default URLInputButton;
