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
 * @param {any}      props.propValue         - The prop value.
 * @param {Function} props.onAttributeChange - The function to call when the attribute changes.
 * @param {any}      props.attrValue         - The attribute value.
 * @param {Function} props.onPropValueChange - The function to call when the prop value changes.
 * @return {null} The component.
 */
const BlockBindingConnector = ( {
	propValue,
	onAttributeChange,

	attrValue,
	onPropValueChange = () => {},
} ) => {
	const lastPropValue = useRef();
	const lastAttrValue = useRef();

	useEffect( () => {
		/*
		 * When the prop value changes, update the attribute value.
		 */
		if ( propValue === lastPropValue.current ) {
			return;
		}

		lastPropValue.current = propValue;
		onAttributeChange( propValue );
	}, [ onAttributeChange, propValue ] );

	useEffect( () => {
		/*
		 * When the attribute value changes, update the prop value.
		 */
		if ( attrValue === lastAttrValue.current ) {
			return;
		}

		lastAttrValue.current = attrValue;
		onPropValueChange( attrValue );
	}, [ onPropValueChange, attrValue ] );

	return null;
};

const withBlockBindingSupport = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, setAttributes } = props;

		const { getBlockBindingsSource } = useSelect( blockEditorStore );

		const bindings = attributes?.metadata?.bindings;
		const BindingConnectorInstances = [];

		if ( bindings ) {
			Object.entries( bindings ).forEach( ( [ attrName, settings ] ) => {
				const source = getBlockBindingsSource( settings.source );
				const { useSource } = source;

				if ( source ) {
					const attrValue = attributes[ attrName ];

					/*
					 * Pick the prop value and setter
					 * from the source custom hook.
					 */
					const { useValue: [ propValue, setPropValue ] = [] } =
						useSource( props, settings.args );

					// Create a unique key for the connector instance
					const key = `${ settings.source.replace(
						/\//gi,
						'-'
					) }-${ attrName }`;

					BindingConnectorInstances.push(
						<BlockBindingConnector
							key={ key }
							attrValue={ attrValue }
							onAttributeChange={ useCallback(
								( newAttrValue ) => {
									setAttributes( {
										[ attrName ]: newAttrValue,
									} );
								},
								[ attrName ]
							) }
							propValue={ propValue }
							onPropValueChange={ useCallback(
								( newPropValue ) => {
									setPropValue?.( newPropValue );
								},
								[ setPropValue ]
							) }
						/>
					);
				}
			} );
		}

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
