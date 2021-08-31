/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { forwardRef } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import {
	useFocusReturn,
	useFocusOnMount,
	__experimentalUseFocusOutside as useFocusOutside,
	useConstrainedTabbing,
	useMergeRefs,
} from '@wordpress/compose';

function ModalFrame(
	{
		overlayClassName,
		contentLabel,
		aria: { describedby, labelledby },
		children,
		className,
		role = 'dialog',
		style,
		focusOnMount = true,
		shouldCloseOnEsc = true,
		shouldCloseOnClickOutside = true,
		onRequestClose,
	},
	ref
) {
	function handleEscapeKeyDown( event ) {
		if (
			shouldCloseOnEsc &&
			event.keyCode === ESCAPE &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}
	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( onRequestClose );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ ref }
			className={ classnames(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<div
				className={ classnames( 'components-modal__frame', className ) }
				style={ style }
				ref={ useMergeRefs( [
					constrainedTabbingRef,
					focusReturnRef,
					focusOnMountRef,
				] ) }
				role={ role }
				aria-label={ contentLabel }
				aria-labelledby={ contentLabel ? null : labelledby }
				aria-describedby={ describedby }
				tabIndex="-1"
				{ ...( shouldCloseOnClickOutside ? focusOutsideProps : {} ) }
			>
				{ children }
			</div>
		</div>
	);
}

export default forwardRef( ModalFrame );
