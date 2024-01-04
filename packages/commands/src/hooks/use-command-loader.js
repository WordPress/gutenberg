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
 * import { useCommandLoader } from '@wordpress/commands';
 * import { post, page, layout, symbolFilled } from '@wordpress/icons';
 *
 * const icons = {
 *     post,
 *     page,
 *     wp_template: layout,
 *     wp_template_part: symbolFilled,
 * };
 *
 * function usePageSearchCommandLoader( { search } ) {
 *     // Retrieve the pages for the "search" term.
 *     const { records, isLoading } = useSelect( ( select ) => {
 *         const { getEntityRecords } = select( coreStore );
 *         const query = {
 *             search: !! search ? search : undefined,
 *             per_page: 10,
 *             orderby: search ? 'relevance' : 'date',
 *         };
 *         return {
 *             records: getEntityRecords( 'postType', 'page', query ),
 *             isLoading: ! select( coreStore ).hasFinishedResolution(
 *                 'getEntityRecords',
 *                 'postType', 'page', query ]
 *             ),
 *         };
 *     }, [ search ] );
 *
 *     // Create the commands.
 *     const commands = useMemo( () => {
 *         return ( records ?? [] ).slice( 0, 10 ).map( ( record ) => {
 *             return {
 *                 name: record.title?.rendered + ' ' + record.id,
 *                 label: record.title?.rendered
 *                     ? record.title?.rendered
 *                     : __( '(no title)' ),
 *                 icon: icons[ postType ],
 *                 callback: ( { close } ) => {
 *                     const args = {
 *                         postType,
 *                         postId: record.id,
 *                         ...extraArgs,
 *                     };
 *                     document.location = addQueryArgs( 'site-editor.php', args );
 *                     close();
 *                 },
 *             };
 *         } );
 *     }, [ records, history ] );
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
		} );
		return () => {
			unregisterCommandLoader( loader.name );
		};
	}, [
		loader.name,
		loader.hook,
		loader.context,
		loader.disabled,
		registerCommandLoader,
		unregisterCommandLoader,
	] );
}
