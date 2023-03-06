/**
 * WordPress dependencies
 */
import { useMemo, useRef, useState, useEffect } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopover from '../components/block-popover';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';

export function MarginVisualizer( { clientId, attributes, forceShow } ) {
	const margin = attributes?.style?.spacing?.margin;

	const style = useMemo( () => {
		const marginTop = margin?.top
			? getSpacingPresetCssVar( margin?.top )
			: 0;
		const marginRight = margin?.right
			? getSpacingPresetCssVar( margin?.right )
			: 0;
		const marginBottom = margin?.bottom
			? getSpacingPresetCssVar( margin?.bottom )
			: 0;
		const marginLeft = margin?.left
			? getSpacingPresetCssVar( margin?.left )
			: 0;

		return {
			borderTopWidth: marginTop,
			borderRightWidth: marginRight,
			borderBottomWidth: marginBottom,
			borderLeftWidth: marginLeft,
			top: marginTop ? `calc(${ marginTop } * -1)` : 0,
			right: marginRight ? `calc(${ marginRight } * -1)` : 0,
			bottom: marginBottom ? `calc(${ marginBottom } * -1)` : 0,
			left: marginLeft ? `calc(${ marginLeft } * -1)` : 0,
		};
	}, [ margin ] );

	const [ isActive, setIsActive ] = useState( false );
	const valueRef = useRef( margin );
	const timeoutRef = useRef();

	const clearTimer = () => {
		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}
	};

	useEffect( () => {
		if ( ! isShallowEqual( margin, valueRef.current ) && ! forceShow ) {
			setIsActive( true );
			valueRef.current = margin;

			timeoutRef.current = setTimeout( () => {
				setIsActive( false );
			}, 400 );
		}

		return () => {
			setIsActive( false );
			clearTimer();
		};
	}, [ margin, forceShow ] );

	if ( ! isActive && ! forceShow ) {
		return null;
	}

	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstableRefreshSize={ margin }
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
		>
			<div className="block-editor__padding-visualizer" style={ style } />
		</BlockPopover>
	);
}
