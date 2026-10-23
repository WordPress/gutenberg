import { store as blockEditorStore } from '@wordpress/block-editor';

const CONTENT = 'content';
const INNER_BLOCKS = 'innerBlocks';

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/pattern-overrides',
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
				// with serialized block markup, stored as written: the
				// overridable blocks inside keep reading their values from
				// the instance. In the pattern itself, they are edited
				// directly.
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
	// Bound inner blocks are checked with their block's client ID. As
	// overrides are stored by block name, a block without one can't override
	// its inner blocks.
	canUserEditValue: ( { select, clientId } ) =>
		! clientId ||
		!! select( blockEditorStore ).getBlockAttributes( clientId )?.metadata
			?.name,
};
