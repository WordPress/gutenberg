/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useSelect } from '@wordpress/data';
import { unlock } from '../../../../editor/src/lock-unlock';

/**
 * This component is responsible detecting and
 * propagating data changes between block attribute and
 * the block-binding source property.
 *
 * The app creates an instance of this component for each
 * pair of block-attribute/source-property.
 *
 * @param {Object}   props            - The component props.
 * @param {string}   props.attrName   - The attribute name.
 * @param {any}      props.attrValue  - The attribute value.
 * @param {Function} props.useSource  - The custom hook to use the source.
 * @param {Object}   props.blockProps - The block props with bound attributes.
 * @param {Object}   props.args       - The arguments to pass to the source.
 * @return {null}                      This is a data-handling component. Render nothing.
 */
const BlockBindingConnector = ( {
	attrName,
	attrValue,
	useSource,
	blockProps,
	args,
} ) => {
	const lastPropValue = useRef();
	const lastAttrValue = useRef();
	const { value, updateValue } = useSource( blockProps, args );

	const setAttributes = blockProps.setAttributes;

	const onPropValueChange = useCallback(
		( newAttrValue ) => {
			setAttributes( {
				[ attrName ]: newAttrValue,
			} );
		},
		[ attrName, setAttributes ]
	);

	/*
	 * Source Prop => Block Attribute
	 *
	 * Detect changes in source prop value,
	 * and update the attribute value accordingly.
	 */
	useEffect( () => {
		if ( value === lastPropValue.current ) {
			return;
		}

		lastPropValue.current = value;
		onPropValueChange( value );
	}, [ onPropValueChange, value ] );

	/*
	 * Block Attribute => Source Prop
	 *
	 * Detect changes in block attribute value,
	 * and update the source prop value accordingly.
	 */
	useEffect( () => {
		if ( attrValue === lastAttrValue.current ) {
			return;
		}

		lastAttrValue.current = attrValue;
		updateValue( attrValue );
	}, [ updateValue, attrValue ] );

	return null;
};

const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, name } = props;

		const { getBlockBindingsSource } = unlock(
			useSelect( blockEditorStore )
		);

		// Bail early if there are no bindings.
		const bindings = attributes?.metadata?.bindings;
		if ( ! bindings ) {
			return <BlockEdit { ...props } />;
		}

		const BindingConnectorInstances = [];

		Object.entries( bindings ).forEach( ( [ attrName, settings ], i ) => {
			const source = getBlockBindingsSource( settings.source );

			if ( source ) {
				const { useSource } = source;
				const attrValue = attributes[ attrName ];

				// Create a unique key for the connector instance
				const key = `${ settings.source }-${ name }-${ attrName }-${ i }`;

				BindingConnectorInstances.push(
					<BlockBindingConnector
						key={ key }
						attrName={ attrName }
						attrValue={ attrValue }
						useSource={ useSource }
						blockProps={ props }
						args={ settings.args }
					/>
				);
			}
		} );

		return (
			<>
				{ BindingConnectorInstances }
				<BlockEdit { ...props } />
			</>
		);
	},
	'withBlockBindingSupport'
);

export default withBlockBindingSupport;
