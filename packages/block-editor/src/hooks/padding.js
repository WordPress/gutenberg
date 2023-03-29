/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopover from '../components/block-popover';
import { __unstableUseBlockElement as useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

export function PaddingVisualizer( { clientId, attributes, forceShow } ) {
	const blockElement = useBlockElement( clientId );
	const [ style, setStyle ] = useState();

	useLayoutEffect( () => {
		if ( ! blockElement ) {
			return;
		}

		let resizeObserver;
		const blockView = blockElement?.ownerDocument?.defaultView;

		if ( blockView.ResizeObserver ) {
			resizeObserver = new blockView.ResizeObserver( () => {
				setStyle( {
					borderTopWidth: getComputedCSS(
						blockElement,
						'padding-top'
					),
					borderRightWidth: getComputedCSS(
						blockElement,
						'padding-right'
					),
					borderBottomWidth: getComputedCSS(
						blockElement,
						'padding-bottom'
					),
					borderLeftWidth: getComputedCSS(
						blockElement,
						'padding-left'
					),
				} );
			} );
			resizeObserver.observe( blockElement );
		}

		return () => {
			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}
		};
	}, [ blockElement ] );

	const padding = attributes?.style?.spacing?.padding;
	const [ isActive, setIsActive ] = useState( false );
	const valueRef = useRef( padding );
	const timeoutRef = useRef();

	const clearTimer = () => {
		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}
	};

	useEffect( () => {
		if ( ! isShallowEqual( padding, valueRef.current ) && ! forceShow ) {
			setIsActive( true );
			valueRef.current = padding;

			timeoutRef.current = setTimeout( () => {
				setIsActive( false );
			}, 400 );
		}

		return () => {
			setIsActive( false );
			clearTimer();
		};
	}, [ padding, forceShow ] );

	if ( ! isActive && ! forceShow ) {
		return null;
	}

	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstableRefreshSize={ padding }
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
		>
			<div className="block-editor__padding-visualizer" style={ style } />
		</BlockPopover>
	);
}
