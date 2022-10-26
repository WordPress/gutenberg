/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import PositionAreaControl from '../components/position-area-control';
import { LAYOUT_SUPPORT_KEY } from './layout';
import { cleanEmptyObject } from './utils';

const POSITION_OPTIONS = [
	{
		key: 'normal',
		label: __( 'Normal' ),
		value: '',
		name: __( 'Normal' ),
	},
	{
		key: 'sticky',
		label: __( 'Sticky' ),
		value: 'sticky',
		name: __( 'Sticky' ),
	},
];

const POSITION_SIDES = [ 'top', 'right', 'bottom', 'left' ];
const VALID_POSITION_TYPES = [ 'sticky', 'fixed' ];

/**
 * Get calculated position CSS.
 *
 * @param {Object} props          Component props.
 * @param {string} props.selector Selector to use.
 * @param {Object} props.style    Style object.
 * @return {string} The generated CSS rules.
 */
export function getPositionCSS( { selector, style } ) {
	let output = '';

	const { position } = style?.layout || {};

	if ( ! VALID_POSITION_TYPES.includes( position ) ) {
		return output;
	}

	output += `${ selector } {`;
	output += `position: ${ position };`;

	POSITION_SIDES.forEach( ( side ) => {
		if ( style?.layout?.[ side ] !== undefined ) {
			output += `${ side }: ${ style.layout[ side ] };`;
		}
	} );

	if ( position === 'sticky' || position === 'fixed' ) {
		// TODO: Work out where to put the magic z-index value.
		output += `z-index: 250`;
	}
	output += `}`;

	return output;
}

/**
 * Determines if there is position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, LAYOUT_SUPPORT_KEY );
	return !! ( true === support || support?.allowPosition );
}

/**
 * Checks if there is a current value in the position block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a position value set.
 */
export function hasPositionValue( props ) {
	return props.attributes.style?.layout?.position !== undefined;
}

/**
 * Resets the position block support attributes. This can be used when disabling
 * the position support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetPosition( { attributes = {}, setAttributes } ) {
	const { style = {} } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			layout: {
				...style?.layout,
				position: undefined,
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if position settings have been disabled.
 *
 * @param {string} name The name of the block.
 *
 * @return {boolean} Whether padding setting is disabled.
 */
export function useIsPositionDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'layout.position' );

	return ! hasPositionSupport( blockName ) || isDisabled;
}

/**
 * From a style.layout object, find the first side with a value.
 *
 * This allows inferring the selected area based on the presence of a value for one of
 * the four sides, `top`, `bottom`, `right`, and `left.
 *
 * @param {Object} styleLayout An object that can contain `top`, `bottom`, `right`, and `left` keys.
 * @return {?string} The side with a value.
 */
function getFirstActiveAreaValue( styleLayout ) {
	if ( ! styleLayout ) {
		return;
	}
	const foundSide = Object.entries( styleLayout ).find(
		( [ key, value ] ) =>
			POSITION_SIDES.includes( key ) && value !== undefined
	);

	if ( foundSide ) {
		return foundSide[ 0 ];
	}
}

/**
 * Inspector control panel containing the padding related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Padding edit element.
 */
export function PositionEdit( props ) {
	const {
		attributes: { style = {} },
		setAttributes,
	} = props;

	if ( useIsPositionDisabled( props ) ) {
		return null;
	}

	const onChangeSide = ( next ) => {
		if ( next !== undefined && ! POSITION_SIDES.includes( next ) ) {
			return;
		}

		// For now, use a hard-coded `0px` value for the position.
		// `0px` is preferred over `0` as it can be used in `calc()` functions.
		// In the future, it could be useful to allow for an offset value.
		const newValue = '0px';

		const newSides = {
			top: undefined,
			right: undefined,
			bottom: undefined,
			left: undefined,
		};

		if ( next !== undefined ) {
			newSides[ next ] = newValue;
		}

		const newStyle = {
			...style,
			layout: {
				...style?.layout,
				...newSides,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const onChangeType = ( next ) => {
		const newStyle = {
			...style,
			layout: {
				...style?.layout,
				position: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const areaValue = getFirstActiveAreaValue( style?.layout );

	return Platform.select( {
		web: (
			<>
				<PositionAreaControl
					help={ __(
						'The area of a page that this block should occupy'
					) }
					onChange={ onChangeSide }
					value={ areaValue }
				/>
				<ToggleGroupControl
					label={ __( 'Position' ) }
					help={ __(
						"Lock this block to an area of the page so it doesn't scroll with page content"
					) }
					value={ style?.layout?.position || '' }
					onChange={ ( newValue ) => {
						onChangeType( newValue );
					} }
					isBlock
				>
					{ POSITION_OPTIONS.map( ( option ) => (
						<ToggleGroupControlOption
							key={ option.key }
							value={ option.value }
							label={ option.label }
							aria-label={ option.name }
							showTooltip={ true }
						/>
					) ) }
				</ToggleGroupControl>
			</>
		),
		native: null,
	} );
}
