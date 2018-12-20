/**
 * External dependencies
 */
import { mapKeys } from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { select, dispatch, withSelect, withDispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { compose } from '@wordpress/compose';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

/**
 * Registers a new format provided a unique name and an object defining its
 * behavior.
 *
 * @param {string} name     Format name.
 * @param {Object} settings Format settings.
 *
 * @return {?WPFormat} The format, if it has been successfully registered;
 *                     otherwise `undefined`.
 */
export function registerFormatType( name, settings ) {
	settings = {
		name,
		...settings,
	};

	if ( typeof settings.name !== 'string' ) {
		window.console.error(
			'Format names must be strings.'
		);
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( settings.name ) ) {
		window.console.error(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		return;
	}

	if ( select( 'core/rich-text' ).getFormatType( settings.name ) ) {
		window.console.error(
			'Format "' + settings.name + '" is already registered.'
		);
		return;
	}

	if (
		typeof settings.tagName !== 'string' ||
		settings.tagName === ''
	) {
		window.console.error(
			'Format tag names must be a string.'
		);
		return;
	}

	if (
		( typeof settings.className !== 'string' || settings.className === '' ) &&
		settings.className !== null
	) {
		window.console.error(
			'Format class names must be a string, or null to handle bare elements.'
		);
		return;
	}

	if ( ! /^[_a-zA-Z]+[a-zA-Z0-9-]*$/.test( settings.className ) ) {
		window.console.error(
			'A class name must begin with a letter, followed by any number of hyphens, letters, or numbers.'
		);
		return;
	}

	if ( settings.className === null ) {
		const formatTypeForBareElement = select( 'core/rich-text' )
			.getFormatTypeForBareElement( settings.tagName );

		if ( formatTypeForBareElement ) {
			window.console.error(
				`Format "${ formatTypeForBareElement.name }" is already registered to handle bare tag name "${ settings.tagName }".`
			);
			return;
		}
	} else {
		const formatTypeForClassName = select( 'core/rich-text' )
			.getFormatTypeForClassName( settings.className );

		if ( formatTypeForClassName ) {
			window.console.error(
				`Format "${ formatTypeForClassName.name }" is already registered to handle class name "${ settings.className }".`
			);
			return;
		}
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		window.console.error(
			'The format "' + settings.name + '" must have a title.'
		);
		return;
	}

	if ( 'keywords' in settings && settings.keywords.length > 3 ) {
		window.console.error(
			'The format "' + settings.name + '" can have a maximum of 3 keywords.'
		);
		return;
	}

	if ( typeof settings.title !== 'string' ) {
		window.console.error(
			'Format titles must be strings.'
		);
		return;
	}

	dispatch( 'core/rich-text' ).addFormatTypes( settings );

	const getFunctionStackMemoized = memize( ( previousStack = EMPTY_ARRAY, newFunction ) => {
		return [
			...previousStack,
			newFunction,
		];
	} );

	if (
		settings.__experimentalGetPropsForEditableTreePreparation
	) {
		addFilter( 'experimentalRichText', name, ( OriginalComponent ) => {
			let Component = OriginalComponent;
			if (
				settings.__experimentalCreatePrepareEditableTree ||
				settings.__experimentalCreateFormatToValue ||
				settings.__experimentalCreateValueToFormat
			) {
				Component = ( props ) => {
					const additionalProps = {};

					if ( settings.__experimentalCreatePrepareEditableTree ) {
						additionalProps.prepareEditableTree = getFunctionStackMemoized(
							props.prepareEditableTree,
							settings.__experimentalCreatePrepareEditableTree( props[ `format_${ name }` ], {
								richTextIdentifier: props.identifier,
								blockClientId: props.clientId,
							} )
						);
					}

					if ( settings.__experimentalCreateOnChangeEditableValue ) {
						const dispatchProps = Object.keys( props ).reduce( ( accumulator, propKey ) => {
							const propValue = props[ propKey ];
							const keyPrefix = `format_${ name }_dispatch_`;
							if ( propKey.startsWith( keyPrefix ) ) {
								const realKey = propKey.replace( keyPrefix, '' );

								accumulator[ realKey ] = propValue;
							}

							return accumulator;
						}, {} );

						additionalProps.onChangeEditableValue = getFunctionStackMemoized(
							props.onChangeEditableValue,
							settings.__experimentalCreateOnChangeEditableValue( {
								...props[ `format_${ name }` ],
								...dispatchProps,
							}, {
								richTextIdentifier: props.identifier,
								blockClientId: props.clientId,
							} )
						);
					}

					return <OriginalComponent
						{ ...props }
						{ ...additionalProps }
					/>;
				};
			}

			const hocs = [
				withSelect( ( sel, { clientId, identifier } ) => ( {
					[ `format_${ name }` ]: settings.__experimentalGetPropsForEditableTreePreparation(
						sel,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					),
				} ) ),
			];

			if ( settings.__experimentalGetPropsForEditableTreeChangeHandler ) {
				hocs.push( withDispatch( ( disp, { clientId, identifier } ) => {
					const dispatchProps = settings.__experimentalGetPropsForEditableTreeChangeHandler(
						disp,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);

					return mapKeys( dispatchProps, ( value, key ) => {
						return `format_${ name }_dispatch_${ key }`;
					} );
				} ) );
			}

			return compose( hocs )( Component );
		} );
	}

	return settings;
}
