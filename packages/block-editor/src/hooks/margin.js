/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Platform,
	useMemo,
	useRef,
	useState,
	useEffect,
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
 * Determines if there is margin support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasMarginSupport( blockType ) {
	const support = getBlockSupport( blockType, SPACING_SUPPORT_KEY );
	return !! ( true === support || support?.margin );
}

/**
 * Checks if there is a current value in the margin block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}      Whether or not the block has a margin value set.
 */
export function hasMarginValue( props ) {
	return props.attributes.style?.spacing?.margin !== undefined;
}

/**
 * Resets the margin block support attributes. This can be used when disabling
 * the margin support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetMargin( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			spacing: {
				...style?.spacing,
				margin: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if margin settings have been disabled.
 *
 * @param {string} name The name of the block.
 *
 * @return {boolean} Whether margin setting is disabled.
 */
export function useIsMarginDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'spacing.margin' );
	const isInvalid = ! useIsDimensionsSupportValid( blockName, 'margin' );

	return ! hasMarginSupport( blockName ) || isDisabled || isInvalid;
}

/**
 * Inspector control panel containing the margin related configuration
 *
 * @param {Object} props Block props.
 *
 * @return {WPElement} Margin edit element.
 */
export function MarginEdit( props ) {
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
	const sides = useCustomSides( blockName, 'margin' );
	const splitOnAxis =
		sides && sides.some( ( side ) => AXIAL_SIDES.includes( side ) );

	if ( useIsMarginDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				margin: next,
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
						values={ style?.spacing?.margin }
						onChange={ onChange }
						label={ __( 'Margin' ) }
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
						values={ style?.spacing?.margin }
						onChange={ onChange }
						label={ __( 'Margin' ) }
						sides={ sides }
						units={ units }
						allowReset={ false }
						splitOnAxis={ false }
						onMouseOver={ onMouseOver }
						onMouseOut={ onMouseOut }
					/>
				) }
			</>
		),
		native: null,
	} );
}

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
