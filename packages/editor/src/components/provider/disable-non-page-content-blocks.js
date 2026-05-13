/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import usePostContentBlockTypes from './use-post-content-block-types';

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	const postContentBlockTypes = usePostContentBlockTypes();
	const { contentOnlyIds, templateParts } = useSelect(
		( select ) => {
			const { getPostBlocksByName } = unlock( select( editorStore ) );
			const { getBlocksByName } = select( blockEditorStore );
			return {
				contentOnlyIds: getPostBlocksByName( postContentBlockTypes ),
				templateParts: getBlocksByName( 'core/template-part' ),
			};
		},
		[ postContentBlockTypes ]
	);
	// This is a separate `useSelect` because `templatePartChildren` is
	// derived via flatMap, which always produces a new array. Combining it
	// with the above subscription causes an infinite render loop: the new
	// array fails useSelect's shallow equality check → re-render → effect
	// fires setBlockEditingMode → store changes → useSelect re-runs → …
	const templatePartChildren = useSelect(
		( select ) => {
			const { getBlockOrder } = select( blockEditorStore );
			return templateParts.flatMap( ( clientId ) =>
				getBlockOrder( clientId )
			);
		},
		[ templateParts ]
	);

	const registry = useRegistry();

	// The effects below are split so that changes to one group of blocks
	// don't cause unnecessary set/unset cycles for the others. For example,
	// the root block ('') editing mode only needs to be set once.
	// Child blocks of templates and templateParts are also loaded separately,
	// so these are kept in separate effects.
	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		setBlockEditingMode( '', 'disabled' );

		return () => {
			unsetBlockEditingMode( '' );
		};
	}, [ registry ] );

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		registry.batch( () => {
			for ( const clientId of templateParts ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of templateParts ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ templateParts, registry ] );

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		const contentOnlySet = new Set( contentOnlyIds );

		registry.batch( () => {
			for ( const clientId of contentOnlyIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
			for ( const clientId of templatePartChildren ) {
				if ( ! contentOnlySet.has( clientId ) ) {
					setBlockEditingMode( clientId, 'disabled' );
				}
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of contentOnlyIds ) {
					unsetBlockEditingMode( clientId );
				}
				for ( const clientId of templatePartChildren ) {
					if ( ! contentOnlySet.has( clientId ) ) {
						unsetBlockEditingMode( clientId );
					}
				}
			} );
		};
	}, [ contentOnlyIds, templatePartChildren, registry ] );

	return null;
}
