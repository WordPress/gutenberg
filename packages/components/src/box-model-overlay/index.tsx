/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useEffect,
	useMemo,
	useCallback,
	forwardRef,
	useImperativeHandle,
	cloneElement,
	Children,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';
import type {
	BoxModelOverlayProps,
	BoxModelOverlayPropsWithChildren,
	BoxModelOverlayPropsWithTargetRef,
	BoxModelOverlayHandle,
} from './types';

const DEFAULT_SHOW_VALUES: BoxModelOverlayProps[ 'showValues' ] = {};

// Copied from Chrome's DevTools: https://github.com/ChromeDevTools/devtools-frontend/blob/088a8f175bd58f2e0e2d492e991a3253124d7c11/front_end/core/common/Color.ts#L931
const MARGIN_COLOR = 'rgba( 246, 178, 107, 0.66 )';
// Copied from Chrome's DevTools: https://github.com/ChromeDevTools/devtools-frontend/blob/088a8f175bd58f2e0e2d492e991a3253124d7c11/front_end/core/common/Color.ts#L927
const PADDING_COLOR = 'rgba( 147, 196, 125, 0.55 )';

const OverlayPopover = styled( Popover )`
	&& {
		pointer-events: none;
		box-sizing: content-box;
		border-style: solid;
		border-color: ${ MARGIN_COLOR };
		// The overlay's top-left point is positioned at the center of the target,
		// so we'll have add some negative offsets.
		transform: translate( -50%, -50% );

		&::before {
			content: '';
			display: block;
			position: absolute;
			box-sizing: border-box;
			height: var( --wp-box-model-overlay-height );
			width: var( --wp-box-model-overlay-width );
			top: var( --wp-box-model-overlay-top );
			left: var( --wp-box-model-overlay-left );
			border-color: ${ PADDING_COLOR };
			border-style: solid;
			border-width: var( --wp-box-model-overlay-padding-top )
				var( --wp-box-model-overlay-padding-right )
				var( --wp-box-model-overlay-padding-bottom )
				var( --wp-box-model-overlay-padding-left );
		}

		.components-popover__content {
			display: none;
		}
	}
`;

const BoxModelOverlayWithRef = forwardRef<
	BoxModelOverlayHandle,
	BoxModelOverlayPropsWithTargetRef
>( ( { showValues = DEFAULT_SHOW_VALUES, targetRef, ...props }, ref ) => {
	const overlayRef = useRef< HTMLDivElement >();

	const update = useCallback( () => {
		const target = targetRef.current;
		const overlay = overlayRef.current;

		if ( ! target || ! overlay ) {
			return;
		}

		const defaultView = target.ownerDocument.defaultView;

		const domRect = target.getBoundingClientRect();
		const {
			paddingTop,
			paddingBottom,
			paddingLeft,
			paddingRight,
			marginTop,
			marginRight,
			marginBottom,
			marginLeft,
			borderTopWidth,
			borderRightWidth,
			borderBottomWidth,
			borderLeftWidth,
		} = defaultView.getComputedStyle( target );

		overlay.style.height = `${ domRect.height }px`;
		overlay.style.width = `${ domRect.width }px`;

		// Setting margin overlays by using borders as the visual representation.
		const borderWidths = {
			top: showValues.margin?.top ? parseInt( marginTop, 10 ) : 0,
			right: showValues.margin?.right ? parseInt( marginRight, 10 ) : 0,
			bottom: showValues.margin?.bottom
				? parseInt( marginBottom, 10 )
				: 0,
			left: showValues.margin?.left ? parseInt( marginLeft, 10 ) : 0,
		};
		overlay.style.borderWidth = [
			borderWidths.top,
			borderWidths.right,
			borderWidths.bottom,
			borderWidths.left,
		]
			.map( ( px ) => `${ px }px` )
			.join( ' ' );

		// The overlay will always position itself at the center of the target,
		// but the overlay could have different size than the target because of the
		// borders we added above.
		// We want to "cancel out" those offsets by doing a `transform: translate`.
		overlay.style.transform = `translate(calc(-50% + ${
			( borderWidths.right - borderWidths.left ) / 2
		}px), calc(-50% + ${
			( borderWidths.bottom - borderWidths.top ) / 2
		}px))`;

		// Set pseudo element's position to take account for borders.
		overlay.style.setProperty(
			'--wp-box-model-overlay-height',
			`${
				domRect.height -
				parseInt( borderTopWidth, 10 ) -
				parseInt( borderBottomWidth, 10 )
			}px`
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-width',
			`${
				domRect.width -
				parseInt( borderLeftWidth, 10 ) -
				parseInt( borderRightWidth, 10 )
			}px`
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-top',
			borderTopWidth
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-left',
			borderLeftWidth
		);

		// Setting padding values via CSS custom properties so that they can
		// be applied in the pseudo elements.
		overlay.style.setProperty(
			'--wp-box-model-overlay-padding-top',
			showValues.padding?.top ? paddingTop : '0'
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-padding-right',
			showValues.padding?.right ? paddingRight : '0'
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-padding-bottom',
			showValues.padding?.bottom ? paddingBottom : '0'
		);
		overlay.style.setProperty(
			'--wp-box-model-overlay-padding-left',
			showValues.padding?.left ? paddingLeft : '0'
		);
	}, [ targetRef, showValues.margin, showValues.padding ] );

	// Make the imperative `update` method available via `ref`.
	useImperativeHandle( ref, () => ( { update } ), [ update ] );

	const getAnchorRect = useCallback(
		() => targetRef.current.getBoundingClientRect(),
		[ targetRef ]
	);

	// Completely skip rendering the popover if none of showValues is true.
	const shouldShowOverlay = useMemo(
		() =>
			Object.values( showValues.margin ?? {} ).some(
				( value ) => value === true
			) ||
			Object.values( showValues.padding ?? {} ).some(
				( value ) => value === true
			),
		[ showValues.margin, showValues.padding ]
	);

	useEffect( () => {
		const target = targetRef.current;

		if ( ! shouldShowOverlay || ! target ) {
			return;
		}

		const defaultView = target.ownerDocument.defaultView;

		update();

		const resizeObserver = new defaultView.ResizeObserver( update );
		const mutationObserver = new defaultView.MutationObserver( update );

		// Observing size changes.
		resizeObserver.observe( target, { box: 'border-box' } );
		// Observing padding and margin changes.
		mutationObserver.observe( target, {
			attributes: true,
			attributeFilter: [ 'style' ],
		} );

		// Percentage paddings are based on parent element's width,
		// so we need to also listen to the parent's size changes.
		const parentElement = target.parentElement;
		let parentResizeObserver: ResizeObserver;
		if ( parentElement ) {
			parentResizeObserver = new defaultView.ResizeObserver( update );
			parentResizeObserver.observe( parentElement, {
				box: 'content-box',
			} );
		}

		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			if ( parentResizeObserver ) {
				parentResizeObserver.disconnect();
			}
		};
	}, [ targetRef, shouldShowOverlay, update ] );

	return shouldShowOverlay ? (
		<OverlayPopover
			position="middle center"
			__unstableForcePosition
			__unstableForceXAlignment
			getAnchorRect={ getAnchorRect }
			animate={ false }
			aria-hidden="true"
			focusOnMount={ false }
			ref={ overlayRef }
			{ ...props }
		/>
	) : null;
} );

const BoxModelOverlayWithChildren = forwardRef<
	BoxModelOverlayHandle,
	BoxModelOverlayPropsWithChildren
>( ( { children, ...props }, ref ) => {
	const targetRef = useRef< HTMLElement >();

	return (
		<>
			{ cloneElement( Children.only( children ), { ref: targetRef } ) }
			<BoxModelOverlayWithRef
				{ ...props }
				targetRef={ targetRef }
				ref={ ref }
			/>
		</>
	);
} );

const hasChildren = (
	props: BoxModelOverlayProps
): props is BoxModelOverlayPropsWithChildren => 'children' in props;

const BoxModelOverlay = forwardRef<
	BoxModelOverlayHandle,
	BoxModelOverlayProps
>( ( props, ref ) => {
	if ( hasChildren( props ) ) {
		return <BoxModelOverlayWithChildren { ...props } ref={ ref } />;
	}

	return <BoxModelOverlayWithRef { ...props } ref={ ref } />;
} );

export {
	BoxModelOverlayProps,
	BoxModelOverlayPropsWithChildren,
	BoxModelOverlayPropsWithTargetRef,
	BoxModelOverlayHandle,
};

export default BoxModelOverlay;
