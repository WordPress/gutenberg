/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useMemo } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopover from '../components/block-popover';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';

export function PaddingVisualizer( { clientId, attributes, forceShow } ) {
	const padding = attributes?.style?.spacing?.padding;
	const style = useMemo( () => {
		return {
			borderTopWidth: padding?.top
				? getSpacingPresetCssVar( padding?.top )
				: 0,
			borderRightWidth: padding?.right
				? getSpacingPresetCssVar( padding?.right )
				: 0,
			borderBottomWidth: padding?.bottom
				? getSpacingPresetCssVar( padding?.bottom )
				: 0,
			borderLeftWidth: padding?.left
				? getSpacingPresetCssVar( padding?.left )
				: 0,
		};
	}, [ padding ] );

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
