import { applyFilters, hasFilter } from '@wordpress/hooks';
import {
	Autocomplete as WCAutocomplete,
	__unstableUseAutocompleteProps as useAutocompleteProps,
} from '@wordpress/components';
import { useEffect, useLayoutEffect, useMemo } from '@wordpress/element';
import { getDefaultBlockName, getBlockSupport } from '@wordpress/blocks';
import { useBlockEditContext } from '../block-edit/context';
import blockAutocompleter from '../../autocompleters/block';
import type {
	BlockEditorAutocompleteProps,
	Completer,
	UseBlockEditorAutocompleteOptions,
	UseBlockEditorAutocompletePropsOptions,
} from './types';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 */
const EMPTY_ARRAY: Completer[] = [];

function useCompleters( {
	completers = EMPTY_ARRAY,
}: {
	completers?: Completer[];
} ) {
	const { name } = useBlockEditContext();
	return useMemo( () => {
		let filteredCompleters = [ ...completers ];

		if (
			name === getDefaultBlockName() ||
			getBlockSupport( name, '__experimentalSlashInserter', false )
		) {
			filteredCompleters = [
				...filteredCompleters,
				// It lists its items through `useItems`, so it has no `options`.
				blockAutocompleter as Completer,
			];
		}

		if ( hasFilter( 'editor.Autocomplete.completers' ) ) {
			// Provide copies so filters may directly modify them.
			if ( filteredCompleters === completers ) {
				filteredCompleters = filteredCompleters.map(
					( completer ) => ( { ...completer } )
				);
			}

			// Filters are untyped.
			filteredCompleters = applyFilters(
				'editor.Autocomplete.completers',
				filteredCompleters,
				name
			) as Completer[];
		}

		return filteredCompleters;
	}, [ completers, name ] );
}

export function useBlockEditorAutocompleteProps(
	props: UseBlockEditorAutocompletePropsOptions
) {
	return useAutocompleteProps( {
		...props,
		completers: useCompleters( props ),
	} );
}

/**
 * Sets attributes on an element, and returns a function that restores the
 * values they had.
 *
 * @param element    The element.
 * @param attributes The attribute values, by name. Undefined ones are left as
 *                   they are.
 * @return Restores the attributes.
 */
function setAttributes(
	element: Element,
	attributes: Record< string, string | undefined >
) {
	const previous = new Map< string, string | null >();
	for ( const [ name, value ] of Object.entries( attributes ) ) {
		if ( value !== undefined ) {
			previous.set( name, element.getAttribute( name ) );
			element.setAttribute( name, value );
		}
	}
	return () => {
		for ( const [ name, value ] of previous ) {
			if ( value === null ) {
				element.removeAttribute( name );
			} else {
				element.setAttribute( name, value );
			}
		}
	};
}

/**
 * Runs the autocomplete of a field: attaches to the field, sets the ARIA
 * attributes describing the autocomplete state on it, and returns the popover
 * to render.
 *
 * Unlike `useBlockEditorAutocompleteProps`, it needs no props spread on the
 * field, so it can run in a component that only renders while the field is
 * selected, which is when completions are offered.
 *
 * @param options         Autocomplete options.
 * @param options.element The field.
 * @return The popover to render.
 */
export function useBlockEditorAutocomplete( {
	element,
	...options
}: UseBlockEditorAutocompleteOptions ) {
	const {
		ref,
		children: popover,
		'aria-autocomplete': ariaAutocomplete,
		'aria-haspopup': ariaHasPopup,
		'aria-controls': ariaControls,
		'aria-owns': ariaOwns,
		'aria-activedescendant': ariaActiveDescendant,
	} = useBlockEditorAutocompleteProps( options );
	const attributes = useMemo(
		() => ( {
			'aria-autocomplete': ariaAutocomplete,
			'aria-haspopup': ariaHasPopup,
			'aria-controls': ariaControls,
			'aria-owns': ariaOwns,
			'aria-activedescendant': ariaActiveDescendant,
		} ),
		[
			ariaAutocomplete,
			ariaHasPopup,
			ariaControls,
			ariaOwns,
			ariaActiveDescendant,
		]
	);

	useLayoutEffect( () => {
		if ( ! element ) {
			return;
		}
		ref( element );
		return () => {
			ref( null );
		};
	}, [ ref, element ] );

	// Set along with the popover, before it paints.
	useLayoutEffect(
		() => ( element ? setAttributes( element, attributes ) : undefined ),
		[ element, attributes ]
	);

	// While a focused editing host owns the selection (the block supports
	// `editableRoot`), ARIA attributes describing the autocomplete state must
	// be mirrored onto the host: assistive technology resolves them relative
	// to the focused element.
	useEffect( () => {
		const host = element?.parentElement?.closest(
			'[contenteditable="true"]'
		);
		return host ? setAttributes( host, attributes ) : undefined;
	}, [ element, attributes ] );

	return popover;
}

/**
 * Wrap the default Autocomplete component with one that supports a filter hook
 * for customizing its list of autocompleters.
 */
function BlockEditorAutocomplete( props: BlockEditorAutocompleteProps ) {
	return (
		<WCAutocomplete { ...props } completers={ useCompleters( props ) } />
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/autocomplete/README.md
 */
export default BlockEditorAutocomplete;
