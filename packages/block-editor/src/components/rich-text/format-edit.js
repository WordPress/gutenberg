/**
 * WordPress dependencies
 */
import { getActiveFormat, getActiveObject } from '@wordpress/rich-text';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';

const DEFAULT_BLOCK_CONTEXT = {};

export const usesContextKey = Symbol( 'usesContext' );

function Edit( { onChange, onFocus, value, forwardedRef, settings } ) {
	const {
		name,
		edit: EditFunction,
		[ usesContextKey ]: usesContext,
	} = settings;

	const blockContext = useContext( BlockContext );

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ usesContext, blockContext ] );

	if ( ! EditFunction ) {
		return null;
	}

	const activeFormat = getActiveFormat( value, name );
	const isActive = activeFormat !== undefined;
	const activeObject = getActiveObject( value );
	const isObjectActive =
		activeObject !== undefined && activeObject.type === name;

	return (
		<EditFunction
			key={ name }
			isActive={ isActive }
			activeAttributes={ isActive ? activeFormat.attributes || {} : {} }
			isObjectActive={ isObjectActive }
			activeObjectAttributes={
				isObjectActive ? activeObject.attributes || {} : {}
			}
			value={ value }
			onChange={ onChange }
			onFocus={ onFocus }
			contentRef={ forwardedRef }
			context={ context }
		/>
	);
}

export default function FormatEdit( { formatTypes, ...props } ) {
	return formatTypes.map( ( settings ) => (
		<Edit settings={ settings } { ...props } key={ settings.name } />
	) );
}
