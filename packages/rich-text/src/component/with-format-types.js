/**
 * External dependencies
 */
import { mapKeys, reduce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatchWithMap } from '@wordpress/data';

export default function withFormatTypes( RichText ) {
	return ( props ) => {
		const { clientId, identifier } = props;
		const formatTypes = useSelect( ( sel ) => sel( 'core/rich-text' ).getKeyedFormatTypes(), [] );
		const selectProps = useSelect( ( sel ) => {
			return reduce( formatTypes, ( acc, settings ) => {
				if ( ! settings.__experimentalGetPropsForEditableTreePreparation ) {
					return acc;
				}

				const selectPrefix = `format_prepare_props_(${ settings.name })_`;
				return {
					...acc,
					...mapKeys(
						settings.__experimentalGetPropsForEditableTreePreparation( sel, {
							richTextIdentifier: identifier,
							blockClientId: clientId,
						} ),
						( value, key ) => selectPrefix + key
					),
				};
			}, {} );
		}, [ formatTypes, clientId, identifier ] );
		const dispatchProps = useDispatchWithMap( ( disp ) => {
			return reduce( formatTypes, ( acc, settings ) => {
				if ( ! settings.__experimentalGetPropsForEditableTreeChangeHandler ) {
					return acc;
				}

				const dispatchPrefix = `format_on_change_props_(${ settings.name })_`;
				return {
					...acc,
					...mapKeys(
						settings.__experimentalGetPropsForEditableTreeChangeHandler( disp, {
							richTextIdentifier: identifier,
							blockClientId: clientId,
						} ),
						( value, key ) => dispatchPrefix + key
					),
				};
			}, {} );
		}, [ formatTypes, clientId, identifier ] );

		const args = {
			richTextIdentifier: identifier,
			blockClientId: clientId,
		};
		const combined = {
			...selectProps,
			...dispatchProps,
		};

		const newProps = reduce( formatTypes, ( acc, settings ) => {
			if ( ! settings.__experimentalCreatePrepareEditableTree ) {
				return acc;
			}

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

		return (
			<RichText
				{ ...props }
				{ ...selectProps }
				{ ...dispatchProps }
				{ ...newProps }
			/>
		);
	};
}
