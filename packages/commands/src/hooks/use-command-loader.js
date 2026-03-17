/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

/**
 * Attach a command loader to the command palette. Used for dynamic commands.
 *
 * @param {import('../store/actions').WPCommandLoaderConfig} loader command loader config.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { addQueryArgs } from '@wordpress/url';
 * import { useCommandLoader } from '@wordpress/commands';
 * import { page } from '@wordpress/icons';
 * import { useSelect } from '@wordpress/data';
 * import { store as coreStore } from '@wordpress/core-data';
 * import { useMemo } from '@wordpress/element';
 *
 * function usePageSearchCommandLoader( { search } ) {
 *     // Retrieve the pages for the "search" term.
 *     const { records, isLoading } = useSelect(
 *         ( select ) => {
 *             const { getEntityRecords } = select( coreStore );
 *             const query = {
 *                 search: !! search ? search : undefined,
 *                 per_page: 10,
 *                 orderby: search ? 'relevance' : 'date',
 *             };
 *             return {
 *                 records: getEntityRecords( 'postType', 'page', query ),
 *                 isLoading: ! select( coreStore ).hasFinishedResolution(
 *                     'getEntityRecords',
 *                     [ 'postType', 'page', query ]
 *                 ),
 *             };
 *         },
 *         [ search ]
 *     );
 *
 *     // Create the commands.
 *     const commands = useMemo( () => {
 *         return ( records ?? [] ).slice( 0, 10 ).map( ( record ) => {
 *             return {
 *                 name: record.title?.rendered + ' ' + record.id,
 *                 label: record.title?.rendered
 *                     ? record.title?.rendered
 *                     : __( '(no title)' ),
 *                 icon: page,
 *                 category: 'edit',
 *                 callback: ( { close } ) => {
 *                     const args = {
 * 							p: '/page',
 * 							postId: record.id,
 *                     };
 *                     document.location = addQueryArgs( 'site-editor.php', args );
 *                     close();
 *                 },
 *             };
 *         } );
 *     }, [ records ] );
 *
 *     return {
 *         commands,
 *         isLoading,
 *     };
 * }
 *
 * useCommandLoader( {
 *     name: 'myplugin/page-search',
 *     hook: usePageSearchCommandLoader,
 * } );
 * ```
 */
export default function useCommandLoader( loader ) {
	const { registerCommandLoader, unregisterCommandLoader } =
		useDispatch( commandsStore );
	useEffect( () => {
		if ( loader.disabled ) {
			return;
		}
		registerCommandLoader( {
			name: loader.name,
			hook: loader.hook,
			context: loader.context,
			category: loader.category,
		} );
		return () => {
			unregisterCommandLoader( loader.name );
		};
	}, [
		loader.name,
		loader.hook,
		loader.context,
		loader.category,
		loader.disabled,
		registerCommandLoader,
		unregisterCommandLoader,
	] );
}
