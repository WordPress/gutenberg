/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const CONTENT = 'content';

/**
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/pattern-overrides',
	getValues( { select, clientId, context, bindings } ) {
		const patternOverridesContent = context[ 'pattern/overrides' ];
		const {
			getBlockAttributes,
			getBlockParentsByBlockName,
			getEditedContentOnlySection,
		} = unlock( select( blockEditorStore ) );
		const editedContentOnlySection = getEditedContentOnlySection();
		const [ patternClientId ] = getBlockParentsByBlockName(
			clientId,
			'core/block',
			true
		);
		const currentBlockAttributes = getBlockAttributes( clientId );

		// If the pattern source is being edited (editedContentOnlySection), skip
		// returning the override values and instead return the original pattern's
		// attribute values instead.
		if (
			! patternClientId ||
			( editedContentOnlySection &&
				editedContentOnlySection === patternClientId )
		) {
			return currentBlockAttributes;
		}

		const overridesValues = {};
		for ( const attributeName of Object.keys( bindings ) ) {
			const overridableValue =
				patternOverridesContent?.[
					currentBlockAttributes?.metadata?.name
				]?.[ attributeName ];

			// If it has not been overridden, return the original value.
			// Check undefined because empty string is a valid value.
			if ( overridableValue === undefined ) {
				overridesValues[ attributeName ] =
					currentBlockAttributes[ attributeName ];
				continue;
			} else {
				overridesValues[ attributeName ] =
					overridableValue === '' ? undefined : overridableValue;
			}
		}
		return overridesValues;
	},
	setValues( { select, dispatch, clientId, bindings } ) {
		const {
			getBlockAttributes,
			getBlockParentsByBlockName,
			getEditedContentOnlySection,
		} = unlock( select( blockEditorStore ) );
		const currentBlockAttributes = getBlockAttributes( clientId );
		const blockName = currentBlockAttributes?.metadata?.name;
		if ( ! blockName ) {
			return;
		}

		const editedContentOnlySection = getEditedContentOnlySection();
		const [ patternClientId ] = getBlockParentsByBlockName(
			clientId,
			'core/block',
			true
		);

		// Extract the updated attributes from the source bindings.
		const attributes = Object.entries( bindings ).reduce(
			( attrs, [ key, { newValue } ] ) => {
				attrs[ key ] = newValue;
				return attrs;
			},
			{}
		);

		// If there is no pattern client ID, or the pattern source is being edited
		// (editedContentOnlySection), skip updating the binding and update the block itself.
		if (
			! patternClientId ||
			( editedContentOnlySection &&
				editedContentOnlySection === patternClientId )
		) {
			dispatch( blockEditorStore ).updateBlockAttributes(
				clientId,
				attributes
			);

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
	canUserEditValue: () => true,
};
