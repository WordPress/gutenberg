import { store as blockEditorStore } from '@wordpress/block-editor';
import { parse, serialize } from '@wordpress/blocks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../lock-unlock';

const { bakeAndStripPatternOverrides } = unlock( patternsPrivateApis );

const CONTENT = 'content';
const INNER_BLOCKS = 'innerBlocks';
const PATTERN_OVERRIDES_SOURCE = 'core/pattern-overrides';

/**
 * Returns the serialized inner blocks with the overrides of the pattern
 * instance applied to the overridable blocks inside them, which lose their
 * pattern overrides bindings. Otherwise those blocks would keep reading their
 * values from the instance.
 *
 * @param {string} innerBlocks The serialized inner blocks.
 * @param {Object} overrides   The overrides of the pattern instance.
 *
 * @return {string} The serialized inner blocks to store.
 */
function bakePatternOverrides( innerBlocks, overrides ) {
	if ( ! innerBlocks.includes( PATTERN_OVERRIDES_SOURCE ) ) {
		return innerBlocks;
	}
	return serialize(
		bakeAndStripPatternOverrides( parse( innerBlocks ), overrides ),
		{ isInnerBlocks: true }
	);
}

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: PATTERN_OVERRIDES_SOURCE,
	usesContext: [ 'pattern/overrides' ],
	getValues( { select, clientId, context, bindings } ) {
		const patternOverridesContent = context[ 'pattern/overrides' ];
		const { getBlockAttributes } = select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );

		const overridesValues = {};
		for ( const attributeName of Object.keys( bindings ) ) {
			const overridableValue =
				patternOverridesContent?.[
					currentBlockAttributes?.metadata?.name
				]?.[ attributeName ];

			// The inner blocks are overridden with serialized block markup,
			// where an empty string means no inner blocks. Without an
			// override, the block keeps its own inner blocks.
			if ( attributeName === INNER_BLOCKS ) {
				overridesValues[ attributeName ] =
					typeof overridableValue === 'string'
						? overridableValue
						: undefined;
				continue;
			}

			// If it has not been overridden, return the original value.
			// Check undefined because empty string is a valid value.
			if ( overridableValue === undefined ) {
				overridesValues[ attributeName ] =
					currentBlockAttributes?.[ attributeName ];
				continue;
			} else {
				overridesValues[ attributeName ] =
					overridableValue === '' ? undefined : overridableValue;
			}
		}
		return overridesValues;
	},
	setValues( { select, dispatch, clientId, bindings } ) {
		const { getBlockAttributes, getBlockParentsByBlockName, getBlocks } =
			select( blockEditorStore );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const blockName = currentBlockAttributes?.metadata?.name;
		if ( ! blockName ) {
			return;
		}

		const [ patternClientId ] = getBlockParentsByBlockName(
			clientId,
			'core/block',
			true
		);

		// Extract the updated attributes from the source bindings.
		const attributes = Object.entries( bindings ).reduce(
			( attrs, [ key, { newValue } ] ) => {
				// The inner blocks are only overridden in a pattern instance,
				// with serialized block markup. In the pattern itself, they
				// are edited directly.
				if (
					key === INNER_BLOCKS &&
					( ! patternClientId || typeof newValue !== 'string' )
				) {
					return attrs;
				}
				attrs[ key ] = newValue;
				return attrs;
			},
			{}
		);
		if ( INNER_BLOCKS in bindings && ! Object.keys( attributes ).length ) {
			return;
		}

		// If there is no pattern client ID, sync blocks with the same name and same attributes.
		if ( ! patternClientId ) {
			const syncBlocksWithSameName = ( blocks ) => {
				for ( const block of blocks ) {
					if ( block.attributes?.metadata?.name === blockName ) {
						dispatch( blockEditorStore ).updateBlockAttributes(
							block.clientId,
							attributes
						);
					}
					syncBlocksWithSameName( block.innerBlocks );
				}
			};

			syncBlocksWithSameName( getBlocks() );
			return;
		}
		const currentBindingValue =
			getBlockAttributes( patternClientId )?.[ CONTENT ];

		dispatch( blockEditorStore ).updateBlockAttributes( patternClientId, {
			[ CONTENT ]: {
				...currentBindingValue,
				[ blockName ]: {
					...currentBindingValue?.[ blockName ],
					...Object.entries( attributes ).reduce(
						( acc, [ key, value ] ) => {
							if ( key === INNER_BLOCKS ) {
								acc[ key ] = bakePatternOverrides(
									value,
									currentBindingValue
								);
								return acc;
							}
							// TODO: We need a way to represent `undefined` in the serialized overrides.
							// Also see: https://github.com/WordPress/gutenberg/pull/57249#discussion_r1452987871
							// We use an empty string to represent undefined for now until
							// we support a richer format for overrides and the block bindings API.
							acc[ key ] = value === undefined ? '' : value;
							return acc;
						},
						{}
					),
				},
			},
		} );
	},
	canUserEditValue: () => true,
};
