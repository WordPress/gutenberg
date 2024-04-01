/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useLayoutEffect, useCallback, useState } from '@wordpress/element';
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

const DEFAULT_BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title', 'alt' ],
	'core/button': [ 'url', 'text', 'linkTarget' ],
};

/**
 * Based on the given block name,
 * check if it is possible to bind the block.
 *
 * @param {string} blockName   - The block name.
 * @param {Object} allowBlocks - The allowed blocks settings.
 * @return {boolean} Whether it is possible to bind the block to sources.
 */
export function canBindBlock(
	blockName,
	allowBlocks = DEFAULT_BLOCK_BINDINGS_ALLOWED_BLOCKS
) {
	return blockName in allowBlocks;
}

/**
 * Based on the given block name and attribute name,
 * check if it is possible to bind the block attribute.
 *
 * @param {string} blockName     - The block name.
 * @param {string} attributeName - The attribute name.
 * @param {Object} allowBlocks   - The allowed blocks settings.
 * @return {boolean} Whether it is possible to bind the block attribute.
 */
export function canBindAttribute(
	blockName,
	attributeName,
	allowBlocks = DEFAULT_BLOCK_BINDINGS_ALLOWED_BLOCKS
) {
	return (
		canBindBlock( blockName, allowBlocks ) &&
		allowBlocks[ blockName ]?.includes( attributeName )
	);
}

/**
 * This component is responsible for detecting and
 * propagating data changes from the source to the block.
 *
 * @param {Object}   props                   - The component props.
 * @param {string}   props.attrName          - The attribute name.
 * @param {Object}   props.blockProps        - The block props with bound attribute.
 * @param {Object}   props.sourceHandler     - Source handler.
 * @param {Object}   props.args              - The arguments to pass to the source.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
const BindingConnector = ( {
	args,
	attrName,
	blockProps,
	sourceHandler,
	onPropValueChange,
} ) => {
	const { placeholder, value: propValue } = sourceHandler.useSource(
		blockProps,
		args
	);

	const { name: blockName } = blockProps;
	const attrValue = blockProps.attributes[ attrName ];

	const updateBoundAttibute = useCallback(
		( newAttrValue, prevAttrValue ) => {
			/*
			 * If the attribute is a RichTextData instance,
			 * (core/paragraph, core/heading, core/button, etc.)
			 * compare its HTML representation with the new value.
			 *
			 * To do: it looks like a workaround.
			 * Consider improving the attribute and metadata fields types.
			 */
			if ( prevAttrValue instanceof RichTextData ) {
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

			if ( prevAttrValue === newAttrValue ) {
				return;
			}

			onPropValueChange( { [ attrName ]: newAttrValue } );
		},
		[ attrName, onPropValueChange ]
	);

	useLayoutEffect( () => {
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
				updateBoundAttibute( null );
				return;
			}

			updateBoundAttibute( placeholder );
		}
	}, [
		updateBoundAttibute,
		propValue,
		attrValue,
		placeholder,
		blockName,
		attrName,
	] );

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

	/*
	 * Create binding object filtering
	 * only the attributes that can be bound.
	 */
	const allowBindings = Object.entries( bindings ).reduce(
		( acc, [ attrName, settings ] ) => {
			const source = blockBindingsSources[ settings.source ];
			// Check if the block has a valid source handler.
			if ( ! source?.useSource ) {
				return false;
			}

			// Check if the attribute can be bound.
			const allowBlocks = source?.settings?.blocks;
			if ( canBindAttribute( blockProps.name, attrName, allowBlocks ) ) {
				acc[ attrName ] = {
					...settings,
					handler: source, // populate the source handler.
				};
			}

			return acc;
		},
		{}
	);

	return (
		<>
			{ Object.entries( allowBindings ).map(
				( [ attrName, settings ] ) => {
					return (
						<BindingConnector
							key={ attrName }
							attrName={ attrName }
							sourceHandler={ settings.handler }
							blockProps={ blockProps }
							args={ settings.args }
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
		/*
		 * Collect and update the bound attributes
		 * in a separate state.
		 */
		const [ boundAttributes, setBoundAttributes ] = useState( {} );
		const updateBoundAttributes = useCallback(
			( newAttributes ) =>
				setBoundAttributes( ( prev ) => ( {
					...prev,
					...newAttributes,
				} ) ),
			[]
		);

		const bindings = props.attributes.metadata?.bindings || {};

		return (
			<>
				{ Object.keys( bindings ).length > 0 && (
					<BlockBindingBridge
						blockProps={ props }
						bindings={ bindings }
						onPropValueChange={ updateBoundAttributes }
					/>
				) }

				<BlockEdit
					{ ...props }
					attributes={ { ...props.attributes, ...boundAttributes } }
				/>
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
