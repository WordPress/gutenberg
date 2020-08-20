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
		const { clientId, position } = dropTarget;
		const blockRect = getBlockRect( clientId );

		if ( position === 'top' ) {
			return {
				top: blockRect.top,
				height: 0,
				left: blockRect.left,
				width: blockRect.width,
			};
		} else if ( position === 'inside' || position === 'bottom' ) {
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
				'is-dropping-inside': dropTarget?.position === 'inside',
			} ),
		[ dropTarget ]
	);

	return <div className={ className } style={ style } />;
}
