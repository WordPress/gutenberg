/**
 * External dependencies
 */
import classnames from 'classnames';
import mergeRefs from 'react-merge-refs';

/**
 * WordPress dependencies
 */

import { Component } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import {
	useFocusReturn,
	useFocusOnMount,
	useConstrainedTabbing,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import withFocusOutside from '../higher-order/with-focus-outside';

function ModalFrameContent( {
	overlayClassName,
	contentLabel,
	aria: { describedby, labelledby },
	children,
	className,
	role,
	style,
	focusOnMount,
	shouldCloseOnEsc,
	onRequestClose,
} ) {
	function handleEscapeKeyDown( event ) {
		if ( shouldCloseOnEsc && event.keyCode === ESCAPE ) {
			event.stopPropagation();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}
	const focusOnMountRef = useFocusOnMount();
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<div
				className={ classnames( 'components-modal__frame', className ) }
				style={ style }
				ref={ mergeRefs( [
					constrainedTabbingRef,
					focusReturnRef,
					focusOnMount ? focusOnMountRef : null,
				] ) }
				role={ role }
				aria-label={ contentLabel }
				aria-labelledby={ contentLabel ? null : labelledby }
				aria-describedby={ describedby }
				tabIndex="-1"
			>
				{ children }
			</div>
		</div>
	);
}

class ModalFrame extends Component {
	constructor() {
		super( ...arguments );
		this.handleFocusOutside = this.handleFocusOutside.bind( this );
	}

	/**
	 * Callback function called when clicked outside the modal.
	 *
	 * @param {Object} event Mouse click event.
	 */
	handleFocusOutside( event ) {
		if (
			this.props.shouldCloseOnClickOutside &&
			this.props.onRequestClose
		) {
			this.props.onRequestClose( event );
		}
	}

	/**
	 * Renders the modal frame element.
	 *
	 * @return {WPElement} The modal frame element.
	 */
	render() {
		return <ModalFrameContent { ...this.props } />;
	}
}

export default withFocusOutside( ModalFrame );
