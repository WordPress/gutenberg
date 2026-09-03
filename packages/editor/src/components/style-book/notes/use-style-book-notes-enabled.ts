import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

type UseStyleBookNotesEnabledOptions = {
	enabled?: boolean;
};

type UseStyleBookNotesEnabledResult = {
	// `core-data` types the global styles id as a string, though the value it
	// resolves is the `wp_global_styles` post id.
	globalStylesId: number | string | undefined;
	isEnabled: boolean;
};

/**
 * Whether Style Book notes are available at all.
 *
 * Both the sidebar and the per-example buttons ask this, so the two can never
 * disagree and leave a button that opens nothing.
 *
 * The checks are server-led on purpose. `wp_global_styles` declaring notes
 * support is exactly what the REST endpoints enforce, so without it every read
 * and write would be refused and the UI must not appear; and because a note is
 * a write to global styles, the capability to check is the one for that
 * record, not a generic comment capability.
 *
 * Answering costs REST requests - a post type record and a capability probe -
 * so callers pass `enabled` to say when the answer is wanted. The sidebar is
 * mounted for the whole editor session but only matters once the Style Book is
 * open, and asking earlier would add requests to every site editor load,
 * whether or not anyone visits the Style Book.
 *
 * @param options
 * @param options.enabled Whether to resolve the answer at all. Defaults to
 *                        true.
 * @return The post notes are stored on, and whether the feature is available.
 */
export function useStyleBookNotesEnabled( {
	enabled = true,
}: UseStyleBookNotesEnabledOptions = {} ): UseStyleBookNotesEnabledResult {
	const globalStylesId = useSelect(
		( select ) =>
			enabled
				? select( coreStore ).__experimentalGetCurrentGlobalStylesId()
				: undefined,
		[ enabled ]
	);

	const supportsNotes = useSelect(
		( select ) => {
			if ( ! enabled ) {
				return false;
			}
			const postType =
				select( coreStore ).getPostType( 'wp_global_styles' );
			/*
			 * `add_post_type_support()` stores its arguments as an array, so
			 * the REST `supports.editor` value is `[ { notes: true } ]` rather
			 * than a bare `true`. Read it the way the comments controller
			 * does; `core-data` types `supports` as a map of strings, which
			 * does not describe that shape.
			 */
			const supports = postType?.supports as
				| Record< string, Array< { notes?: boolean } > >
				| undefined;
			return !! supports?.editor?.[ 0 ]?.notes;
		},
		[ enabled ]
	);

	/*
	 * The id has to be resolved first: an unqualified `canUser` here would
	 * fire an OPTIONS request against the collection route rather than the
	 * record, which answers a different question.
	 */
	const canEditGlobalStyles = useSelect(
		( select ) =>
			globalStylesId
				? select( coreStore ).canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: globalStylesId,
				  } )
				: false,
		[ globalStylesId ]
	);

	return {
		globalStylesId,
		isEnabled: !! globalStylesId && supportsNotes && !! canEditGlobalStyles,
	};
}
