/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalUseToggler as useToggler } from '@wordpress/compose';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';

export default function Dropdown( {
	renderContent,
	renderToggle,
	position = 'bottom right',
	className,
	contentClassName,
	expandOnMobile,
	headerTitle,
	focusOnMount,
	popoverProps,
	onClose,
	onToggle,
} ) {
	const containerRef = useRef();

	const {
		togglerHandlers: { onMouseDown: togglerMouseDown, ...togglerHandlers },
		isOn: isOpen,
		setIsOn,
		offUnlessToggler,
	} = useToggler();

	const isUsingTogglerHook = useRef();
	togglerHandlers.onMouseDown = () => {
		// Notes the use of this codepath to obviate closeIfFocusOutside with
		// offUnlessToggler from the Toggler hook.
		if ( ! isUsingTogglerHook.current ) {
			isUsingTogglerHook.current = true;
		}
		togglerMouseDown();
	};

	function setAndPropagateIsOpen( valueOrSetter ) {
		let syncState;
		if ( typeof valueOrSetter === 'function' ) {
			setIsOn( ( current ) => ( syncState = valueOrSetter( current ) ) );
		} else {
			setIsOn( ( syncState = valueOrSetter ) );
		}
		// propagates updates synchronously
		onToggle?.( syncState );
		if ( ! syncState ) onClose?.( syncState );
	}

	useEffect(
		() => () => {
			if ( onToggle ) {
				onToggle( false );
			}
		},
		[]
	);

	function toggle() {
		setAndPropagateIsOpen( ( current ) => ! current );
	}

	/**
	 * Closes the dropdown if focus leaves the popover other than the case that
	 * the toggle button was focused. This is a legacy codepath as it fails for
	 * UAs that don't focus button elements when pressed. Can be removed after
	 * all Dropdown implementors have been updated to use the `togglerHandlers`
	 * passed to the renderToggle callback.
	 */
	function closeIfFocusOutside() {
		const { ownerDocument } = containerRef.current;
		if ( ! containerRef.current.contains( ownerDocument.activeElement ) ) {
			close();
		}
	}

	function close() {
		setAndPropagateIsOpen( false );
	}

	const args = { isOpen, onToggle: toggle, onClose: close };

	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ containerRef }
		>
			{ renderToggle( { ...args, togglerHandlers } ) }
			{ isOpen && (
				<Popover
					position={ position }
					onClose={
						isUsingTogglerHook.current
							? offUnlessToggler
							: closeIfFocusOutside
					}
					expandOnMobile={ expandOnMobile }
					headerTitle={ headerTitle }
					focusOnMount={ focusOnMount }
					{ ...popoverProps }
					anchorRef={
						popoverProps?.anchorRef ?? containerRef.current
					}
					className={ classnames(
						'components-dropdown__content',
						popoverProps ? popoverProps.className : undefined,
						contentClassName
					) }
				>
					{ renderContent( args ) }
				</Popover>
			) }
		</div>
	);
}
