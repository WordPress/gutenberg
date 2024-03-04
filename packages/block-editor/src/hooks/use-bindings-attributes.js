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
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @param {Object}   props.settings          - The block bindings settings.
 * @return {null}                              Data-handling component. Render nothing.
 */
const BindingConnector = ( { attrName, settings, onPropValueChange } ) => {
	const { useSource } = settings;
	const newPropValue = useSource();
	const prevPropValue = useRef( newPropValue );

	useLayoutEffect( () => {
		if ( prevPropValue.current === newPropValue ) {
			return;
		}

		// Propagate the source value to the block attribute.
		onPropValueChange( { [ attrName ]: newPropValue } );
		prevPropValue.current = newPropValue;
	}, [ newPropValue, attrName, onPropValueChange ] );

	return null;
};

/**
 * BlockBindingBridge acts like a component wrapper
 * that connects the bound attributes of a block
 * to the source helper.
 * For this, it creates a BindingConnector for each bound attribute.
 *
 * @param {Object}   props                   - The component props.
 * @param {Object}   props.bindings          - The block bindings settings.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
function BlockBindingBridge( { bindings, onPropValueChange } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attrName, settings ] ) => {
				return (
					<BindingConnector
						key={ attrName }
						attrName={ attrName }
						settings={ settings }
						onPropValueChange={ onPropValueChange }
					/>
				);
			} ) }
		</>
	);
}

const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const blockBindingsSources = unlock(
			useSelect( blocksStore )
		).getAllBlockBindingsSources();

		/*
		 * A trigger to refresh
		 * the bound attributesvalues
		 * when the source data changes.
		 * It is used to force the re-render of the BlockEdit component.
		 */
		const [ refreshTrigger, setTrigger ] = useState( 1 );
		const refreshExternalSourceData = setTrigger.bind(
			null,
			refreshTrigger + 1
		);

		/*
		 * Binding object:
		 * - filter out the bindings that are not allowed for the current block.
		 * - Map the bindings to the source handler.
		 *
		 * Object shape:
		 * {
		 *  [attrName]: {
		 *    args: Object,
		 *    source: string,
		 *    value: any,
		 *    placeholder: any,
		 *    useSource: Function,
		 * },
		 */
		const bindings = useMemo( () => {
			if ( ! refreshTrigger ) {
				return {};
			}

			return Object.fromEntries(
				Object.entries( props.attributes.metadata?.bindings || {} )
					.filter(
						( [ attrName, binding ] ) =>
							canBindAttribute( props.name, attrName ) &&
							!! blockBindingsSources[ binding.source ]?.init
					)
					.map( ( [ attrName, binding ] ) => {
						const settings = blockBindingsSources[
							binding.source
						].init( props, binding.args );

						let value = settings.value;

						/*
						 * If the original attribute value is a RichTextData,
						 * the bound value should be a RichTextData as well.
						 * To do: Probably we should have a better way to handle this.
						 */
						const originalAttrValue = props.attributes[ attrName ];

						if ( typeof value !== 'undefined' ) {
							value =
								originalAttrValue instanceof RichTextData
									? RichTextData.fromHTMLString(
											settings.value
									  )
									: settings.value;
						} else if ( settings.placeholder ) {
							/*
							 * Placeholder fallback.
							 * If the attribute is `src` or `href`,
							 * a placeholder can't be used because it is not a valid url.
							 * ToDo: Adding this workaround until
							 * attributes and metadata fields types are improved and include `url`.
							 */
							const htmlAttribute = getBlockType( props.name )
								.attributes[ attrName ].attribute;

							if (
								htmlAttribute === 'src' ||
								htmlAttribute === 'href'
							) {
								value = null;
							} else {
								value = settings.placeholder;
							}
						}

						return [
							attrName,
							{
								source: binding.source,
								args: binding.args,
								...settings,
								value,
							},
						];
					} )
			);
		}, [ blockBindingsSources, props, refreshTrigger ] );

		// Pick bound attributes from the (memoized) bindings object.
		const boundAttributes = Object.fromEntries(
			Object.entries( bindings ).map( ( [ attrName, settings ] ) => {
				const { value } = settings;
				return [ attrName, value ];
			} )
		);

		/**
		 * Helper function to update the block attributes,
		 * handling both bound and unbound attributes.
		 *
		 * For unbound attributes, it calls the BlockEdit `setAttributes` callback.
		 * For bound attributes, it calls the source `update` handler function.
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
							//Collect unbound attributes.
							unboundAttributes[ boundAttributeName ] = value;
						} else {
							// Update bound attribute, one by one.
							const settings = bindings[ boundAttributeName ];
							settings.update( value );
						}
					}
				);

				// Update unbound attributes.
				if ( Object.keys( unboundAttributes ).length ) {
					props.setAttributes( unboundAttributes );
				}
			},
			[ bindings, props ]
		);

		if ( Object.keys( bindings ).length <= 0 ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockBindingBridge
					blockProps={ props }
					bindings={ bindings }
					onPropValueChange={ refreshExternalSourceData }
				/>

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
