/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ManagedContent from './managed-content';
import * as ariaHelper from './aria-helper';
import './style.scss';

let modalCount = 0;

function getParentElement( parentSelector ) {
	return parentSelector ? parentSelector() : document.body;
}

class Modal extends Component {
	static setAppElement( node ) {
		ariaHelper.setAppElement( node );
	}

	componentDidMount() {
		modalCount++;
		ariaHelper.hideApp();

		getParentElement(
			this.props.parentSelector
		).appendChild( this.node );
	}

	componentWillUnmount() {
		modalCount--;
		if ( modalCount === 0 ) {
			ariaHelper.showApp();
		}

		getParentElement(
			this.props.parentSelector
		).removeChild( this.node );
		ariaHelper.showApp();
	}

	render() {
		this.props.style = this.props.style || {};
		const {
			overlayClassName,
			className,
			style: {
				content = {},
				overlay = {},
			},
			children,
			...otherProps
		} = this.props;

		if ( ! this.node ) {
			this.node = document.createElement( 'div' );
		}

		return createPortal(
			<div
				className={ classnames(
					'components-modal__screen-overlay',
					overlayClassName
				) }
				style={ overlay }>
				<ManagedContent
					focusOnMount
					style={ content }
					className={ classnames(
						'components-modal__content',
						className
					) }
					{ ...otherProps } >
					{ children }
				</ManagedContent>
			</div>,
			this.node
		);
	}
}

export default Modal;
