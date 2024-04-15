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
 * Return the attribute value to be used in the binding.
 * It handles the case when the attribute instance is a RichTextData.
 *
 * @param {*} value - Attribute value instance,
 * @return {string}   String raw value.
 */
function getAttributeValue( value ) {
	if ( value instanceof RichTextData ) {
		return value.toHTMLString();
	}

	return value;
}

/**
 * Create a new attribute instance,
 * based on the original type.
 *
 * @param {string} value    - The attribute value.
 * @param {*}      original - The original attribute instance.
 * @return {*}                The new attribute instance.
 */
function castValue( value, original ) {
	if ( original instanceof RichTextData ) {
		/*
		 * Before to create a new instance,
		 * return the original instance if the value is the same.
		 */
		if ( value === original.toHTMLString() ) {
			return original;
		}

		return RichTextData.fromHTMLString( value );
	}

	return value;
}

/**
 * This component is responsible for detecting and
 * propagating data changes from the source to the block.
 *
 * @param {Object}   props                   - The component props.
 * @param {string}   props.attrName          - The attribute name.
 * @param {string}   props.attrValue         - The attribute value.
 * @param {Object}   props.blockProps        - The block props with bound attribute.
 * @param {Object}   props.source            - Source handler.
 * @param {Object}   props.args              - The arguments to pass to the source.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
const BindingConnector = ( {
	args,
	attrName,
	attrValue,
	blockProps,
	source,
	onPropValueChange,
} ) => {
	const {
		placeholder,
		value: propValue,
		updateValue: updatePropValue,
	} = source.useSource( blockProps, args );

	const { name: blockName } = blockProps;

	// Store previous values for the attribute and external property
	const prevAttrValue = useRef( attrValue );
	const prevPropValue = useRef(); // `undefined` for the fisrt sync (from source to block).

	/*
	 * Update the bound attribute value,
	 * casting the value to the original type.
	 *
	 * @param {string} next    - The new attribute value.
	 * @param {string} current - The current attribute value.
	 * @return {void}
	 */
	const updateBoundAttribute = useCallback(
		( next, current ) =>
			onPropValueChange( {
				[ attrName ]: castValue( next, current ),
			} ),
		[ attrName, onPropValueChange ]
	);

	useLayoutEffect( () => {
		const rawAttrValue = getAttributeValue( attrValue );

		if ( typeof propValue !== 'undefined' ) {
			/*
			 * On-sync from external property to attribute.
			 * When the propValue is different from the previous one,
			 * and also it's different from the current attribute value,
			 * update the attribute value.
			 */
			if ( propValue !== prevPropValue.current ) {
				// Store the current propValue to compare in the next render.
				prevPropValue.current = propValue;

				if ( propValue !== rawAttrValue ) {
					updateBoundAttribute( propValue, attrValue );
					return; // close the sync cycle.
				}
			}
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
				updateBoundAttribute( null );
				return; // close the sync cycle.
			}

			updateBoundAttribute( placeholder );
			return; // close the sync cycle.
		}

		// Sync from block attribute to external source property.
		if ( rawAttrValue !== getAttributeValue( prevAttrValue.current ) ) {
			if ( rawAttrValue === propValue ) {
				return;
			}

			prevAttrValue.current = attrValue;
			updatePropValue( rawAttrValue );
		}
	}, [
		updateBoundAttribute,
		propValue,
		placeholder,
		blockName,
		attrName,
		updatePropValue,
		attrValue,
		blockProps,
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
 * @param {Object}   props.boundAttributes   - The bound attributes state.
 * @param {Function} props.onPropValueChange - The function to call when the attribute value changes.
 * @return {null}                              Data-handling component. Render nothing.
 */
function BlockBindingBridge( {
	blockProps,
	bindings,
	boundAttributes,
	onPropValueChange,
} ) {
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
							attrValue={ boundAttributes[ attrName ] }
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
		 * Custom setAttributes function.
		 * It reorganizes bound and unbound attributes
		 * in a new object and treats their updating separately.
		 *
		 * @param {Object} newAttributes - The new attributes values.
		 * @return {void}
		 */
		function setAttributes( newAttributes ) {
			// Get the bound and unbound attributes.
			const attrs = Object.entries( newAttributes ).reduce(
				( acc, [ key, value ] ) => {
					acc[ key in bindings ? 'bounds' : 'unbounds' ][ key ] =
						value;
					return acc;
				},
				{ bounds: {}, unbounds: {} }
			);

			// Update the `unbound` attributes in case of any.
			if ( Object.keys( attrs.unbounds ).length > 0 ) {
				props.setAttributes( attrs.unbounds );
			}

			// Update the `bound` attributes in case of any.
			if ( Object.keys( attrs.bounds ).length > 0 ) {
				updateBoundAttributes( attrs.bounds );
			}
		}

		return (
			<>
				{ Object.keys( bindings ).length > 0 && (
					<BlockBindingBridge
						blockProps={ props }
						bindings={ bindings }
						boundAttributes={ boundAttributes }
						onPropValueChange={ updateBoundAttributes }
					/>
				) }

				<BlockEdit
					{ ...props }
					attributes={ { ...props.attributes, ...boundAttributes } }
					setAttributes={ setAttributes }
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
