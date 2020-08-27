/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

function getBlockRect( clientId ) {
	if ( ! clientId ) {
		return;
	}
	const blockElementSelector = `#block-navigation-block-${ clientId } [draggable="true"]`;
	const blockElement = document.querySelector( blockElementSelector );
	return blockElement?.getBoundingClientRect();
}

export default function BlockNavigationDropIndicator( { dropTarget } ) {
	const style = useMemo( () => {
		if ( ! dropTarget ) {
			return;
		}

		const { rootClientId, clientId, dropPosition } = dropTarget;

		const dropTargetClientId =
			dropPosition === 'inside' ? rootClientId : clientId;

		const blockRect = getBlockRect( dropTargetClientId );

		if ( ! blockRect ) {
			return;
		}

		if ( dropPosition === 'top' ) {
			return {
				top: blockRect.top,
				height: 0,
				left: blockRect.left,
				width: blockRect.width,
			};
		} else if ( dropPosition === 'inside' || dropPosition === 'bottom' ) {
			return {
				top: blockRect.bottom,
				height: 0,
				left: blockRect.left,
				width: blockRect.width,
			};
		}
	}, [ dropTarget ] );

	const className = useMemo(
		() =>
			classnames( 'block-navigation-drop-indicator', {
				'is-hidden': ! dropTarget,
				'is-dropping-inside': dropTarget?.dropPosition === 'inside',
			} ),
		[ dropTarget ]
	);

	return <div className={ className } style={ style } />;
}
