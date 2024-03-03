/**
 * WordPress dependencies
 */
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import {
	useLayoutEffect,
	useCallback,
	useState,
	useMemo,
	useRef,
} from '@wordpress/element';
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

	const prevPropValue = useRef( propValue );

	useLayoutEffect( () => {
		if ( prevPropValue.current !== propValue ) {
			onPropValueChange( { [ attrName ]: propValue } );
			prevPropValue.current = propValue;
		}
	}, [ propValue, attrName, onPropValueChange ] );

	return null;
};

/**
 * BlockBindingBridge acts like a component wrapper
 * that connects the bound attributes of a block
 * to the source helper.
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
		const blockBindingsSources = unlock(
			useSelect( blocksStore )
		).getAllBlockBindingsSources();

		const [ trigger, setTrigger ] = useState( 1 );
		const retrigger = setTrigger.bind( null, trigger + 1 );

		/*
		 * Create binding object filtering
		 * only the attributes that can be bound.
		 */
		const bindings = Object.fromEntries(
			Object.entries( props.attributes.metadata?.bindings || {} ).filter(
				( [ attrName ] ) => canBindAttribute( props.name, attrName )
			)
		);

		/**
		 * Helper function to update the block attributes,
		 * handling both bound and unbound attributes.
		 * For unboud attributes, it uses the BlockEdit `setAttributes` prop.
		 * For bound attributes, it uses the source handler `updateValue` function.
		 *
		 * @param {Object} nextAttributes - The next attributes to update.
		 * @return {void}
		 */
		const updateAttributes = useCallback(
			( nextAttributes ) => {
				const unboundAttributes = {};
				Object.entries( nextAttributes ).forEach(
					( [ boundAttributeName, value ] ) => {
						if ( ! ( boundAttributeName in bindings ) ) {
							/*
							 * Collect unbound attributes.
							 * They will be updated using the BlockEdit `setAttributes` prop.
							 */
							unboundAttributes[ boundAttributeName ] = value;
						} else {
							/*
							 * Update bound attributes.
							 * They will be updated using the source handler `updateValue` function.
							 */
							const boundAttributeSourceHandlerName =
								bindings[ boundAttributeName ]?.source;
							const sourceHandler =
								blockBindingsSources[
									boundAttributeSourceHandlerName
								];
							const { helper } = sourceHandler;
							const { update } = helper(
								props,
								bindings[ boundAttributeName ].args
							);
							update( value );
						}
					}
				);

				// Update unbound attributes.
				if ( Object.keys( unboundAttributes ).length ) {
					props.setAttributes( unboundAttributes );
				}
			},
			[ bindings, blockBindingsSources, props ]
		);

		/**
		 * Collect the current values of the bound attributes,
		 */
		const boundAttributes = useMemo( () => {
			if ( ! trigger ) {
				return {};
			}

			const attributesStack = {};
			Object.entries( bindings ).forEach(
				( [ attrName, boundAttribute ] ) => {
					const source =
						blockBindingsSources[ boundAttribute.source ];
					if ( ! source?.useSource ) {
						return;
					}

					const { helper } = source;
					const { get } = helper( props, boundAttribute.args );
					attributesStack[ attrName ] = get();
				}
			);
			return attributesStack;
		}, [ bindings, blockBindingsSources, props, trigger ] );

		return (
			<>
				{ Object.keys( bindings ).length > 0 && (
					<BlockBindingBridge
						blockProps={ props }
						bindings={ bindings }
						onPropValueChange={ retrigger }
					/>
				) }

				<BlockEdit
					{ ...props }
					attributes={ { ...props.attributes, ...boundAttributes } }
					setAttributes={ updateAttributes }
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
