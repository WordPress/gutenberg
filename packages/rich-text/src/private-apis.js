/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText as useRichTextOriginal } from './component';
import { useFormatTypes } from './use-format-types';
import { removeFormat } from './remove-format';

function useRichText( {
	allowedFormats,
	withoutInteractiveFormatting,
	__unstableFormatTypeHandlerContext,
	onChange,
	__unstableDependencies = [],
	...props
} ) {
	const {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		allowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext,
	} );

	function addEditorOnlyFormats( record ) {
		return valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, record.text ),
			record.formats
		);
	}

	function removeEditorOnlyFormats( record ) {
		formatTypes.forEach( ( formatType ) => {
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				record = removeFormat(
					record,
					formatType.name,
					0,
					record.text.length
				);
			}
		} );
		return record.formats;
	}

	function addInvisibleFormats( record ) {
		return prepareHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, record.text ),
			record.formats
		);
	}

	const result = useRichTextOriginal( {
		...props,
		onChange( value, { __unstableFormats, __unstableText } ) {
			onChange( value, { __unstableFormats, __unstableText } );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		__unstableDependencies: [ ...dependencies, ...__unstableDependencies ],
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	return { ...result, formatTypes };
}

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
} );
