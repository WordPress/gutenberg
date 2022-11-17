/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { LAYOUT_SUPPORT_KEY } from './layout';
import { cleanEmptyObject } from './utils';

/**
 * Determines if there is content layout support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 * @return {boolean} Whether there is support.
 */
export function hasContentLayoutSupport( blockType ) {
	const support = getBlockSupport( blockType, LAYOUT_SUPPORT_KEY );
	return !! (
		true === support ||
		! support?.default?.type ||
		support?.default?.type === 'default' ||
		support?.default?.type === 'constrained'
	);
}

/**
 * Checks if there is a current value set for content layout.
 *
 * @param {Object} props Block props.
 * @return {boolean} Whether or not the block has a minHeight value set.
 */
export function hasContentLayoutValue( props ) {
	return (
		props.attributes.layout?.type === 'default' ||
		props.attributes.layout?.type === 'constrained'
	);
}

/**
 * Resets the content layout block support attributes.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetContentLayout( { attributes = {}, setAttributes } ) {
	const { layout } = attributes;

	setAttributes( {
		layout: cleanEmptyObject( {
			...layout,
			type: undefined,
		} ),
	} );
}

/**
 * Custom hook that checks if content layout controls have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether content layout control is disabled.
 */
export function useIsContentLayoutDisabled( { name: blockName } = {} ) {
	// TODO: Is this check valid? The following assumes on by default unless explicitly opted out.
	const isDisabled = useSetting( 'layout.contentLayout' ) === false;
	return ! hasContentLayoutSupport( blockName ) || isDisabled;
}
