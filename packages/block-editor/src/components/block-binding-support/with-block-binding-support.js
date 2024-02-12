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
import { unlock } from '../../../../editor/src/lock-unlock';

/**
 * Conponent to bind an attribute to a prop.
 *
 * @param {Object}   props                   - The component props.
 * @param {any}      props.attrValue         - The attribute value.
 * @param {Function} props.onPropValueChange - The function to call when the prop value changes.
 * @param {Function} props.useSource         - The custom hook to use the source.
 * @return {null}                              This is a data-handling component.
 */
const BlockBindingConnector = ( {
	attrValue,
	onPropValueChange = () => {},
	useSource,
} ) => {
	const lastPropValue = useRef();
	const lastAttrValue = useRef();
	const { value, updateValue } = useSource();

	useEffect( () => {
		if ( value === lastPropValue.current ) {
			return;
		}

		lastPropValue.current = value;
		onPropValueChange( value );
	}, [ onPropValueChange, value ] );

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
						attrValue={ attrValue }
						onPropValueChange={ useCallback(
							( newAttrValue ) => {
								props.setAttributes( {
									[ attrName ]: newAttrValue,
								} );
							},
							[ attrName ]
						) }
						useSource={ useSource }
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
