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
	return props.attributes.layout?.position !== undefined;
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
	const { layout = {} } = attributes;

	setAttributes( {
		layout: cleanEmptyObject( {
			...layout,
			position: undefined,
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
 * Inspector control panel containing the padding related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Padding edit element.
 */
export function PositionEdit( props ) {
	const {
		attributes: { layout = {} },
		setAttributes,
	} = props;

	if ( useIsPositionDisabled( props ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newLayout = {
			...layout,
			position: next,
		};

		setAttributes( {
			layout: cleanEmptyObject( newLayout ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				<ToggleGroupControl
					label={ __( 'Position' ) }
					help={ __(
						"Lock this block to an area of the page so it doesn't scroll with page content"
					) }
					value={ layout?.position || '' }
					onChange={ ( newValue ) => {
						onChange( newValue );
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
