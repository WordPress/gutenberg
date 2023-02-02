/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Platform,
	useState,
	useRef,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import {
	AXIAL_SIDES,
	SPACING_SUPPORT_KEY,
	useCustomSides,
	useIsDimensionsSupportValid,
} from './dimensions';
import { cleanEmptyObject } from './utils';
import BlockPopover from '../components/block-popover';
import SpacingSizesControl from '../components/spacing-sizes-control';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
/**
 * Determines if there is padding support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasPaddingSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.padding );
}

/**
 * Checks if there is a current value in the padding block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}      Whether or not the block has a padding value set.
 */
export function hasPaddingValue( props ) {
	return props.attributes.style?.spacing?.padding !== undefined;
}

/**
 * Resets the padding block support attributes. This can be used when disabling
 * the padding support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetPadding( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			spacing: {
				...style?.spacing,
				padding: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if padding settings have been disabled.
 *
 * @param {string} name The name of the block.
 *
 * @return {boolean} Whether padding setting is disabled.
 */
export function useIsPaddingDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'spacing.padding' );
	const isInvalid = ! useIsDimensionsSupportValid( blockName, 'padding' );

	return ! hasPaddingSupport( blockName ) || isDisabled || isInvalid;
}

/**
 * Inspector control panel containing the padding related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Padding edit element.
 */
export function PaddingEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
		onMouseOver,
		onMouseOut,
	} = props;

	const spacingSizes = useSetting( 'spacing.spacingSizes' );

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );
	const sides = useCustomSides( blockName, 'padding' );
	const splitOnAxis =
		sides && sides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	if ( useIsPaddingDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				padding: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				{ ( ! spacingSizes || spacingSizes?.length === 0 ) && (
					<BoxControl
						values={ style?.spacing?.padding }
						onChange={ onChange }
						label={ __( 'Padding' ) }
						sides={ sides }
						units={ units }
						allowReset={ false }
						splitOnAxis={ splitOnAxis }
						onMouseOver={ onMouseOver }
						onMouseOut={ onMouseOut }
					/>
				) }
				{ spacingSizes?.length > 0 && (
					<SpacingSizesControl
						values={ style?.spacing?.padding }
						onChange={ onChange }
						label={ __( 'Padding' ) }
						sides={ sides }
						units={ units }
						allowReset={ false }
						splitOnAxis={ splitOnAxis }
						onMouseOver={ onMouseOver }
						onMouseOut={ onMouseOut }
					/>
				) }
			</>
		),
		native: null,
	} );
}

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
