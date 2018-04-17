/**
 * External dependency
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { Overlay } from '../overlay';

class Modal extends Component {
	render() {
		const {
			overlayClassName,
			modalClassName,
			children,
			isOpen = false,
			requestClose = noop,
		} = this.props;

		if ( ! isOpen ) {
			return null;
		}

		const overlayClassNames = classnames(
			overlayClassName,
			'components-modal__screen-overlay'
		);
		const modalClassNames = classnames(
			modalClassName,
			'components-modal__content'
		);

		return (
			<Overlay
				focusOnMount
				requestClose={ requestClose }
				className={ overlayClassNames }>
				<div className={ modalClassNames }>
					{ children }
				</div>
			</Overlay>
		);
	}
}

export default Modal;
