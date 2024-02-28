/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useReducer } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/** @typedef {import('@wordpress/compose').WPHigherOrderComponent} WPHigherOrderComponent */
/** @typedef {import('@wordpress/blocks').WPBlockSettings} WPBlockSettings */

/**
 * Given a binding of block attributes, returns a higher order component that
 * overrides its `attributes` and `setAttributes` props to sync any changes needed.
 *
 * @return {WPHigherOrderComponent} Higher-order component.
 */

const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

/**
 * Based on the given block name,
 * check if it is possible to bind the block.
 *
 * @param {string} blockName - The block name.
 * @return {boolean} Whether it is possible to bind the block to sources.
 */
export function canBindBlock( blockName ) {
	return blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS;
}

/**
 * Based on the given block name and attribute name,
 * check if it is possible to bind the block attribute.
 *
 * @param {string} blockName     - The block name.
 * @param {string} attributeName - The attribute name.
 * @return {boolean} Whether it is possible to bind the block attribute.
 */
export function canBindAttribute( blockName, attributeName ) {
	return (
		canBindBlock( blockName ) &&
		BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ].includes( attributeName )
	);
}

/**
 * This component is responsible for detecting and
 * propagating data changes from the source to the block.
 *
 * @param {Object}   props                   - The component props.
 * @param {string}   props.attrName          - The attribute name.
 * @param {Object}   props.blockProps        - The block props with bound attribute.
 * @param {Object}   props.source            - Source handler.
 * @param {Object}   props.args              - The arguments to pass to the source.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
const BindingConnector = ( {
	args,
	attrName,
	blockProps,
	source,
	onPropValueChange,
} ) => {
	const { placeholder, value: propValue } = source.useSource(
		blockProps,
		args
	);

	const { name: blockName } = blockProps;
	const attrValue = blockProps.attributes[ attrName ];

	const updateBoundAttibute = useCallback(
		( newAttrValue, prevAttrValue ) => {
			// Bail early if the attribute value is the same.
			if ( prevAttrValue === newAttrValue ) {
				return;
			}
			/*
			 * If the attribute is a RichTextData instance,
			 * (core/paragraph, core/heading, core/button, etc.)
			 * compare its HTML representation with the new value.
			 */
			if ( prevAttrValue instanceof RichTextData ) {
				// If the new value is also a RichTextData instance and the value is the same, bail early.
				if (
					newAttrValue instanceof RichTextData &&
					prevAttrValue.toHTMLString() === newAttrValue.toHTMLString()
				) {
					return;
				}

				// Bail early if the Rich Text value is the same.
				if ( prevAttrValue.toHTMLString() === newAttrValue ) {
					return;
				}

				/*
				 * To preserve the value type,
				 * convert the new value to a RichTextData instance.
				 */
				newAttrValue = RichTextData.fromHTMLString( newAttrValue );
			}

			onPropValueChange( { [ attrName ]: newAttrValue } );
		},
		[ attrName, onPropValueChange ]
	);

	if ( typeof propValue !== 'undefined' ) {
		updateBoundAttibute( propValue, attrValue );
	} else if ( placeholder ) {
		/*
		 * Placeholder fallback.
		 * If the attribute is `src` or `href`,
		 * a placeholder can't be used because it is not a valid url.
		 * Adding this workaround until
		 * attributes and metadata fields types are improved and include `url`.
		 */
		const htmlAttribute =
			getBlockType( blockName ).attributes[ attrName ].attribute;

		if ( htmlAttribute === 'src' || htmlAttribute === 'href' ) {
			updateBoundAttibute( null, attrValue );
			return null;
		}

		updateBoundAttibute( placeholder, attrValue );
	}

	return null;
};

/**
 * BlockBindingBridge acts like a component wrapper
 * that connects the bound attributes of a block
 * to the source handlers.
 * For this, it creates a BindingConnector for each bound attribute.
 *
 * @param {Object}   props                   - The component props.
 * @param {Object}   props.blockProps        - The BlockEdit props object.
 * @param {Object}   props.bindings          - The block bindings settings.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
function BlockBindingBridge( { blockProps, bindings, onPropValueChange } ) {
	const blockBindingsSources = unlock(
		useSelect( blocksStore )
	).getAllBlockBindingsSources();

	return (
		<>
			{ Object.entries( bindings ).map(
				( [ attrName, boundAttribute ] ) => {
					// Bail early if the block doesn't have a valid source handler.
					const source =
						blockBindingsSources[ boundAttribute.source ];
					if ( ! source?.useSource ) {
						return null;
					}

					return (
						<BindingConnector
							key={ attrName }
							attrName={ attrName }
							source={ source }
							blockProps={ blockProps }
							args={ boundAttribute.args }
							onPropValueChange={ onPropValueChange }
						/>
					);
				}
			) }
		</>
	);
}

const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		function attributeReducer( state, action ) {
			return { ...state, ...action };
		}

		/*
		 * Collect and update the bound attributes
		 * in a separate state.
		 */
		const [ boundAttributes, updateBoundAttributes ] = useReducer(
			attributeReducer,
			props.attributes
		);

		/*
		 * Create binding object filtering
		 * only the attributes that can be bound.
		 */
		const bindings = Object.fromEntries(
			Object.entries( props.attributes.metadata?.bindings || {} ).filter(
				( [ attrName ] ) => canBindAttribute( props.name, attrName )
			)
		);

		return (
			<>
				{ Object.keys( bindings ).length > 0 && (
					<BlockBindingBridge
						blockProps={ { ...props, attributes: boundAttributes } }
						bindings={ bindings }
						onPropValueChange={ updateBoundAttributes }
					/>
				) }

				<BlockEdit { ...props } attributes={ boundAttributes } />
			</>
		);
	},
	'withBlockBindingSupport'
);

/**
 * Filters a registered block's settings to enhance a block's `edit` component
 * to upgrade bound attributes.
 *
 * @param {WPBlockSettings} settings - Registered block settings.
 * @param {string}          name     - Block name.
 * @return {WPBlockSettings} Filtered block settings.
 */
function shimAttributeSource( settings, name ) {
	if ( ! canBindBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: withBlockBindingSupport( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/custom-sources-backwards-compatibility/shim-attribute-source',
	shimAttributeSource
);
