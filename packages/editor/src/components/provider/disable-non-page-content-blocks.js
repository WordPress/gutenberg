/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const POST_CONTENT_BLOCK_TYPES = [
	'core/post-title',
	'core/post-featured-image',
	'core/post-content',
];

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	const contentOnlyBlockTypes = useMemo(
		() => [
			...applyFilters(
				'editor.postContentBlockTypes',
				POST_CONTENT_BLOCK_TYPES
			),
			'core/template-part',
		],
		[]
	);

	// Note that there are two separate subscriptions because the result for each
	// returns a new array.
	const contentOnlyIds = useSelect(
		( select ) => {
			const { getPostBlocksByName } = unlock( select( editorStore ) );
			return getPostBlocksByName( contentOnlyBlockTypes );
		},
		[ contentOnlyBlockTypes ]
	);
	const disabledIds = useSelect( ( select ) => {
		const { getBlocksByName, getBlockOrder } = select( blockEditorStore );
		return getBlocksByName( 'core/template-part' ).flatMap( ( clientId ) =>
			getBlockOrder( clientId )
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
