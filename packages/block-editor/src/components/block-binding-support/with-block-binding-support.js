/**
 * External dependencies
 */
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

/**
 * Conponent to bind an attribute to a prop.
 *
 * @param {Object}   props                   - The component props.
 * @param {any}      props.attrValue         - The attribute value.
 * @param {Function} props.onAttributeChange - The function to call when the attribute changes.
 * @param {any}      props.propValue         - The prop value.
 * @param {Function} props.onPropValueChange - The function to call when the prop value changes.
 * @return {null} The component.
 */
const BlockBindingConnector = ( {
	propValue,
	onPropValueChange = () => {},

	attrValue,
	onAttributeChange,
} ) => {
	const lastPropValue = useRef();
	const lastAttrValue = useRef();

	useEffect( () => {
		if ( propValue === lastPropValue.current ) {
			return;
		}

		lastPropValue.current = propValue;
		onPropValueChange( propValue );
	}, [ onPropValueChange, propValue ] );

	useEffect( () => {
		if ( attrValue === lastAttrValue.current ) {
			return;
		}

		lastAttrValue.current = attrValue;
		onAttributeChange( attrValue );
	}, [ onAttributeChange, attrValue ] );

	return null;
};

const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, name } = props;

		const { getBlockBindingsSource } = useSelect( blockEditorStore );

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

				/*
				 * Pick the prop value and setter
				 * from the source custom hook.
				 */
				const { useValue: [ propValue, setPropValue ] = [] } =
					useSource( props, settings.args );

				// Create a unique key for the connector instance
				const key = `${ settings.source }-${ name }-${ attrName }-${ i }`;

				BindingConnectorInstances.push(
					<BlockBindingConnector
						key={ key }
						propValue={ propValue }
						onPropValueChange={ useCallback(
							( newAttrValue ) => {
								props.setAttributes( {
									[ attrName ]: newAttrValue,
								} );
							},
							[ attrName ]
						) }
						attrValue={ attrValue }
						onAttributeChange={ useCallback(
							( newPropValue ) => {
								setPropValue?.( newPropValue );
							},
							[ setPropValue ]
						) }
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
