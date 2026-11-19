import type { ReactNode } from 'react';
import { Popover as WCPopover } from '@wordpress/components';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Whether the field values rendered inside are cut to one line. The table
 * layout sets it for the cells of its columns. Elsewhere values keep their
 * own layout, so the same render works in every layout.
 */
export const TruncateValuesContext = createContext( false );

const OPEN_DELAY = 300;
const CLOSE_DELAY = 150;

function useIsTruncated( element: HTMLElement | null, content: ReactNode ) {
	const [ isTruncated, setIsTruncated ] = useState( false );

	useIsomorphicLayoutEffect( () => {
		if ( ! element ) {
			setIsTruncated( false );
			return;
		}

		const measure = () =>
			setIsTruncated( element.scrollWidth > element.clientWidth );

		measure();

		// The column width follows the window and the other rows, so the
		// value can become cut without its own content changing.
		const resizeObserver =
			typeof ResizeObserver === 'function'
				? new ResizeObserver( measure )
				: undefined;
		resizeObserver?.observe( element );

		return () => resizeObserver?.disconnect();
	}, [ element, content ] );

	return isTruncated;
}

interface TruncatedValueProps {
	/**
	 * The value, as shown in the cell and in the popover.
	 */
	children: ReactNode;
}

/**
 * Cuts a field value to one line with an ellipsis when it does not fit, and
 * shows the full value in a popover while the value is hovered or focused.
 * Outside of `TruncateValuesContext`, it renders the value as is.
 */
export default function TruncatedValue( { children }: TruncatedValueProps ) {
	const shouldTruncate = useContext( TruncateValuesContext );
	const [ element, setElement ] = useState< HTMLSpanElement | null >( null );
	const isTruncated = useIsTruncated( element, children );
	const [ isOpen, setIsOpen ] = useState( false );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | undefined >(
		undefined
	);

	const scheduleOpen = ( open: boolean, delay: number ) => {
		clearTimeout( timeoutRef.current );
		timeoutRef.current = setTimeout( () => setIsOpen( open ), delay );
	};

	useEffect( () => () => clearTimeout( timeoutRef.current ), [] );

	// Let Escape dismiss the popover wherever focus is, including while it is
	// open from hover only.
	useEffect( () => {
		if ( ! isOpen || ! element ) {
			return;
		}
		const { ownerDocument } = element;
		const onKeyDown = ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				clearTimeout( timeoutRef.current );
				setIsOpen( false );
			}
		};
		ownerDocument.addEventListener( 'keydown', onKeyDown );
		return () => ownerDocument.removeEventListener( 'keydown', onKeyDown );
	}, [ isOpen, element ] );

	if ( ! shouldTruncate ) {
		return <>{ children }</>;
	}

	const showPopover = isTruncated && isOpen;

	return (
		<span
			ref={ setElement }
			className="dataviews-truncated-value"
			// Only a value that is cut is a tab stop, so that keyboard users
			// can read the rest of it.
			tabIndex={ isTruncated ? 0 : undefined }
			onMouseEnter={ () =>
				isTruncated && scheduleOpen( true, OPEN_DELAY )
			}
			onMouseLeave={ () => scheduleOpen( false, CLOSE_DELAY ) }
			onFocus={ ( event ) =>
				isTruncated &&
				event.target === element &&
				scheduleOpen( true, 0 )
			}
			onBlur={ () => scheduleOpen( false, 0 ) }
		>
			{ children }
			{ showPopover && (
				<WCPopover
					anchor={ element }
					placement="bottom-start"
					focusOnMount={ false }
					onClose={ () => setIsOpen( false ) }
					// Keep the popover open while the pointer moves into it,
					// so that its text can be selected and copied.
					onMouseEnter={ () => clearTimeout( timeoutRef.current ) }
					onMouseLeave={ () => scheduleOpen( false, CLOSE_DELAY ) }
					className="dataviews-truncated-value__popover"
				>
					<div className="dataviews-truncated-value__content">
						{ children }
					</div>
				</WCPopover>
			) }
		</span>
	);
}
