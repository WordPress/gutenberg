/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

const CONTENT_ONLY_BLOCKS = applyFilters( 'editor.postContentBlockTypes', [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
	'core/template-part',
] );

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	// Note that there are two separate subscription because the result for each
	// returns a new array.
	const contentOnlyIds = useSelect( ( select ) => {
		const { getBlocksByName, getBlockParents, getBlockName } =
			select( blockEditorStore );
		return getBlocksByName( CONTENT_ONLY_BLOCKS ).filter( ( clientId ) =>
			getBlockParents( clientId ).every( ( parentClientId ) => {
				const parentBlockName = getBlockName( parentClientId );
				return (
					// Ignore descendents of the query block.
					parentBlockName !== 'core/query' &&
					// Enable only the top-most block.
					! CONTENT_ONLY_BLOCKS.includes( parentBlockName )
				);
			} )
		);
	}, [] );
	const disabledIds = useSelect( ( select ) => {
		const { getBlocksByName, getBlockOrder } = select( blockEditorStore );
		return getBlocksByName( [ 'core/template-part' ] ).flatMap(
			( clientId ) => getBlockOrder( clientId )
		);
	}, [] );

	const registry = useRegistry();

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		registry.batch( () => {
			setBlockEditingMode( '', 'disabled' );
			for ( const clientId of contentOnlyIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
			for ( const clientId of disabledIds ) {
				setBlockEditingMode( clientId, 'disabled' );
			}
		} );

		return () => {
			registry.batch( () => {
				unsetBlockEditingMode( '' );
				for ( const clientId of contentOnlyIds ) {
					unsetBlockEditingMode( clientId );
				}
				for ( const clientId of disabledIds ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ contentOnlyIds, disabledIds, registry ] );

	return null;
}
