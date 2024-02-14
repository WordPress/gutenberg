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
import { getBlockType } from '@wordpress/blocks';

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
 * @param {Object}   props.blockProps - The block props with bound attribute.
 * @param {Object}   props.args       - The arguments to pass to the source.
 * @return {null}                       This is a data-handling component. Render nothing.
 */
const BlockBindingConnector = ( {
	args,
	attrName,
	attrValue,
	blockProps,
	useSource,
} ) => {
	const {
		placeholder,
		value: propValue,
		updateValue: updatePropValue,
	} = useSource( blockProps, args );

	const blockName = blockProps.name;

	const setAttributes = blockProps.setAttributes;

	const updateBoundAttibute = useCallback(
		( newAttrValue ) => {
			setAttributes( {
				[ attrName ]: newAttrValue,
			} );
		},
		[ attrName, setAttributes ]
	);

	// Store a reference to the last value and attribute value.
	const lastPropValue = useRef( propValue );
	const lastAttrValue = useRef( attrValue );

	/*
	 * Initially sync (first render / onMount ) attribute
	 * value with the source prop value.
	 */
	useEffect( () => {
		updateBoundAttibute( propValue );
	}, [ propValue, updateBoundAttibute ] ); // eslint-disable-line react-hooks/exhaustive-deps

	/*
	 * Sync data.
	 * This effect will run every time
	 * the attribute value or the prop value changes.
	 * It will sync them in both directions.
	 */
	useEffect( () => {
		/*
		 * Source Prop => Block Attribute
		 *
		 * Detect changes in source prop value,
		 * and update the attribute value accordingly.
		 */
		if ( typeof propValue !== 'undefined' ) {
			if ( propValue !== lastPropValue.current ) {
				lastPropValue.current = propValue;
				updateBoundAttibute( propValue );
				return;
			}
		} else if ( placeholder ) {
			/*
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

		/*
		 * Block Attribute => Source Prop
		 *
		 * Detect changes in block attribute value,
		 * and update the source prop value accordingly.
		 */
		if ( attrValue !== lastAttrValue.current && updatePropValue ) {
			lastAttrValue.current = attrValue;
			updatePropValue( attrValue );
		}
	}, [
		updateBoundAttibute,
		propValue,
		attrValue,
		updatePropValue,
		placeholder,
		blockName,
		attrName,
	] );

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
