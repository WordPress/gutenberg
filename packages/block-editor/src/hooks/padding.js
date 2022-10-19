/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
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

	const padding = attributes?.style?.spacing?.padding;
	const isDark = attributes?.isDark;
	const url = attributes?.url;
	const dimRatio = attributes?.dimRatio;

	useEffect( () => {
		if ( ! blockElement ) {
			return;
		}

		// Render diagonal stripes to represent spacing.
		// Leverage blend modes to ensure visibility
		// over different sets of backgrounds.
		const stripes = {
			opacity: '0.8',
			mixBlendMode: 'color-dodge',
		};
		let stripesColor = 'var(--wp-admin-theme-color)';

		// Handle dark contrast.
		if ( isDark ) {
			stripes.mixBlendMode = 'plus-lighter';
			stripesColor = 'rgb(255,255,255)';
		}

		// When the image has preponderance over the
		// colored overlay.
		if ( url && dimRatio <= 50 ) {
			stripes.mixBlendMode = 'plus-lighter';
			stripesColor = 'var(--wp-admin-theme-color)';
		}

		setStyle( {
			borderTopWidth: getComputedCSS( blockElement, 'padding-top' ),
			borderRightWidth: getComputedCSS( blockElement, 'padding-right' ),
			borderBottomWidth: getComputedCSS( blockElement, 'padding-bottom' ),
			borderLeftWidth: getComputedCSS( blockElement, 'padding-left' ),
			backgroundImage: `linear-gradient(135deg, ${ stripesColor } 7.14%, transparent 7.14%, transparent 50%, ${ stripesColor } 50%, ${ stripesColor } 57.14%, transparent 57.14%, transparent 100%)`,
			...stripes,
		} );
	}, [ blockElement, padding, isDark, url, dimRatio ] );

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
