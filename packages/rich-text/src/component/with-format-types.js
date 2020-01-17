/**
 * External dependencies
 */
import { mapKeys } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, __unstableUseDispatchWithMap } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

function formatTypesSelector( select ) {
	return select( 'core/rich-text' ).getFormatTypes();
}

/**
 * This higher-order component provides RichText with the `formatTypes` prop
 * and its derived props from experimental format type settings.
 *
 * @param {WPComponent} RichText The rich text component to add props for.
 *
 * @return {WPComponent} New enhanced component.
 */
export default function withFormatTypes( RichText ) {
	return function WithFormatTypes( props ) {
		const { clientId, identifier } = props;
		const formatTypes = useSelect( formatTypesSelector, [] );
		const selectProps = useSelect( ( select ) => {
			return formatTypes.reduce( ( acc, settings ) => {
				if ( ! settings.__experimentalGetPropsForEditableTreePreparation ) {
					return acc;
				}

				const selectPrefix = `format_prepare_props_(${ settings.name })_`;
				return {
					...acc,
					...mapKeys(
						settings.__experimentalGetPropsForEditableTreePreparation( select, {
							richTextIdentifier: identifier,
							blockClientId: clientId,
						} ),
						( value, key ) => selectPrefix + key
					),
				};
			}, {} );
		}, [ formatTypes, clientId, identifier ] );
		const dispatchProps = __unstableUseDispatchWithMap( ( dispatch ) => {
			return formatTypes.reduce( ( acc, settings ) => {
				if ( ! settings.__experimentalGetPropsForEditableTreeChangeHandler ) {
					return acc;
				}

				const dispatchPrefix = `format_on_change_props_(${ settings.name })_`;
				return {
					...acc,
					...mapKeys(
						settings.__experimentalGetPropsForEditableTreeChangeHandler( dispatch, {
							richTextIdentifier: identifier,
							blockClientId: clientId,
						} ),
						( value, key ) => dispatchPrefix + key
					),
				};
			}, {} );
		}, [ formatTypes, clientId, identifier ] );
		const newProps = useMemo( () => {
			return formatTypes.reduce( ( acc, settings ) => {
				if ( ! settings.__experimentalCreatePrepareEditableTree ) {
					return acc;
				}

				const args = {
					richTextIdentifier: identifier,
					blockClientId: clientId,
				};
				const combined = {
					...selectProps,
					...dispatchProps,
				};

				const { name } = settings;
				const selectPrefix = `format_prepare_props_(${ name })_`;
				const dispatchPrefix = `format_on_change_props_(${ name })_`;
				const propsByPrefix = Object.keys( combined ).reduce( ( accumulator, key ) => {
					if ( key.startsWith( selectPrefix ) ) {
						accumulator[ key.slice( selectPrefix.length ) ] = combined[ key ];
					}

					if ( key.startsWith( dispatchPrefix ) ) {
						accumulator[ key.slice( dispatchPrefix.length ) ] = combined[ key ];
					}

					return accumulator;
				}, {} );

				if ( settings.__experimentalCreateOnChangeEditableValue ) {
					return {
						...acc,
						[ `format_value_functions_(${ name })` ]:
							settings.__experimentalCreatePrepareEditableTree(
								propsByPrefix,
								args
							),
						[ `format_on_change_functions_(${ name })` ]:
							settings.__experimentalCreateOnChangeEditableValue(
								propsByPrefix,
								args
							),
					};
				}

				return {
					...acc,
					[ `format_prepare_functions_(${ name })` ]:
						settings.__experimentalCreatePrepareEditableTree(
							propsByPrefix,
							args
						),
				};
			}, {} );
		}, [ formatTypes, clientId, identifier, selectProps, dispatchProps ] );

		return (
			<RichText
				{ ...props }
				{ ...selectProps }
				{ ...newProps }
				formatTypes={ formatTypes }
			/>
		);
	};
}
