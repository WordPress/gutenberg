/**
 * WordPress dependencies
 */
import { lazy, Suspense } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * `EntitiesSavedStates` lives in `@wordpress/editor`, a classic script that would
 * otherwise be pulled into boot's eager dependencies and force the whole editor
 * (block-editor, block-library, media-utils, …) to load on every view.
 *
 * Loading it through `@wordpress/lazy-editor` — a script module — defers the editor
 * until the "Review changes" modal actually opens, which only happens while editing,
 * when the editor has already been loaded by the canvas.
 */
const EntitiesSavedStates = lazy( () =>
	import( '@wordpress/lazy-editor' ).then( ( module ) => ( {
		default: module.EntitiesSavedStates,
	} ) )
);

export default function LazyEntitiesSavedStates( props: {
	close: () => void;
	variant?: 'inline';
} ) {
	return (
		<Suspense fallback={ <Spinner /> }>
			<EntitiesSavedStates { ...props } />
		</Suspense>
	);
}
