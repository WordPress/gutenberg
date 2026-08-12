import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

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
 * @return {{ globalStylesId: number|undefined, isEnabled: boolean }} The post
 * notes are stored on, and whether the feature is available.
 */
export function useStyleBookNotesEnabled() {
	const globalStylesId = useSelect(
		( select ) =>
			select( coreStore ).__experimentalGetCurrentGlobalStylesId(),
		[]
	);

	const supportsNotes = useSelect( ( select ) => {
		const postType = select( coreStore ).getPostType( 'wp_global_styles' );
		/*
		 * `add_post_type_support()` stores its arguments as an array, so the
		 * REST `supports.editor` value is `[ { notes: true } ]` rather than a
		 * bare `true`. Read it the way the comments controller does.
		 */
		const [ editorSupport ] = postType?.supports?.editor ?? [];
		return !! editorSupport?.notes;
	}, [] );

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
