/**
 * External dependencies
 */
import clickOutside from 'react-click-outside';

/**
 * WordPress Dependencies
 */
import { Component } from 'element';
import { Button } from 'components';
import { __ } from 'i18n';

class AcceptDialog extends Component {
	handleClickOutside() {
		this.props.onClose( 'cancel' );
	}

	render() {
		const { message, onClose, confirmButtonText, cancelButtonText } = this.props;
		const accept = () => onClose( 'accept' );
		const cancel = () => onClose( 'cancel' );

		return (
			<div>
				<div className="utils-accept__dialog">
					<div className="utils-accept__dialog-content">
						{ message }
					</div>
					<div className="utils-accept__dialog-buttons">
						<Button onClick={ cancel } className="button">
							{ cancelButtonText || __( 'Cancel' ) }
						</Button>
						<Button isPrimary onClick={ accept }>
							{ confirmButtonText || __( 'OK' ) }
						</Button>
					</div>
				</div>
			</div>
		);
	}
}

export default clickOutside( AcceptDialog );
