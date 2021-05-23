/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useImperativeHandle,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';

function useObservableState( initialState, onStateChange ) {
	const [ state, setState ] = useState( initialState );
	return [
		state,
		( value ) => {
			setState( value );
			if ( onStateChange ) {
				onStateChange( value );
			}
		},
	];
}

function Dropdown(
	{
		className,
		contentClassName,
		expandOnMobile,
		focusOnMount,
		headerTitle,
		onClose,
		onToggle,
		openOnMount = false,
		popoverProps,
		position = 'bottom right',
		renderContent,
		renderToggle,
	},
	ref
) {
	const containerRef = useRef();
	const [ isOpen, setIsOpen ] = useObservableState( openOnMount, onToggle );

	useEffect(
		() => () => {
			if ( onToggle ) {
				onToggle( false );
			}
		},
		[]
	);

	function toggle() {
		setIsOpen( ! isOpen );
	}

	/**
	 * Closes the dropdown if a focus leaves the dropdown wrapper. This is
	 * intentionally distinct from `onClose` since focus loss from the popover
	 * is expected to occur when using the Dropdown's toggle button, in which
	 * case the correct behavior is to keep the dropdown closed. The same applies
	 * in case when focus is moved to the modal dialog.
	 */
	function closeIfFocusOutside() {
		const { ownerDocument } = containerRef.current;
		if (
			! containerRef.current.contains( ownerDocument.activeElement ) &&
			! ownerDocument.activeElement.closest( '[role="dialog"]' )
		) {
			close();
		}
	}

	function close() {
		if ( onClose ) {
			onClose();
		}
		setIsOpen( false );
	}

	const args = { isOpen, onToggle: toggle, onClose: close };

	useImperativeHandle( ref, () => ( { toggle, close } ), [] );

	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ containerRef }
		>
			{ renderToggle( args ) }
			{ isOpen && (
				<Popover
					position={ position }
					onClose={ close }
					onFocusOutside={ closeIfFocusOutside }
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

export default forwardRef( Dropdown );
