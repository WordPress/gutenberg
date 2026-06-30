/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useLayoutEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import usePostContentBlockTypes from './use-post-content-block-types';

function isNavigationOverlayTemplatePart( attributes ) {
	return (
		attributes?.area === 'navigation-overlay' ||
		attributes?.slug === 'overlay' ||
		attributes?.slug?.includes( 'overlay' )
	);
}

function serializeIds( ids ) {
	return ids.join( '\n' );
}

function deserializeIds( value ) {
	return value ? value.split( '\n' ) : [];
}

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	const postContentBlockTypes = usePostContentBlockTypes();
	const {
		contentOnlyIdsKey,
		isUniversalCanvas,
		templatePartsKey,
		templateSectionIdsKey,
	} = useSelect(
		( select ) => {
			const { getPostBlocksByName } = unlock( select( editorStore ) );
			const {
				getBlockAttributes,
				getBlockName,
				getBlockOrder,
				getBlockParents,
				getBlocksByName,
				getSettings,
			} = select( blockEditorStore );
			const _contentOnlyIds = getPostBlocksByName(
				postContentBlockTypes
			);
			const allTemplateParts = getBlocksByName( 'core/template-part' );
			const editableTemplateParts = allTemplateParts.filter(
				( clientId ) =>
					! isNavigationOverlayTemplatePart(
						getBlockAttributes( clientId )
					)
			);

			const _templateSectionIds = [];
			const _isUniversalCanvas =
				!! getSettings().__experimentalUniversalCanvas;
			if ( _isUniversalCanvas ) {
				const excludedIds = new Set( [
					..._contentOnlyIds,
					...allTemplateParts,
				] );

				for ( const clientId of _contentOnlyIds ) {
					for ( const parentId of getBlockParents( clientId ) ) {
						excludedIds.add( parentId );
					}
				}

				for ( const clientId of getBlockOrder( '' ) ) {
					if (
						! excludedIds.has( clientId ) &&
						getBlockName( clientId ) !== 'core/template-part'
					) {
						_templateSectionIds.push( clientId );
					}
				}
			}

			return {
				contentOnlyIdsKey: serializeIds( _contentOnlyIds ),
				isUniversalCanvas: _isUniversalCanvas,
				templatePartsKey: serializeIds( editableTemplateParts ),
				templateSectionIdsKey: serializeIds( _templateSectionIds ),
			};
		},
		[ postContentBlockTypes ]
	);
	const contentOnlyIds = useMemo(
		() => deserializeIds( contentOnlyIdsKey ),
		[ contentOnlyIdsKey ]
	);
	const templateParts = useMemo(
		() => deserializeIds( templatePartsKey ),
		[ templatePartsKey ]
	);
	const templateSectionIds = useMemo(
		() => deserializeIds( templateSectionIdsKey ),
		[ templateSectionIdsKey ]
	);
	// This is a separate `useSelect` because `templatePartChildren` is
	// derived via flatMap, which always produces a new array. Combining it
	// with the above subscription causes an infinite render loop: the new
	// array fails useSelect's shallow equality check → re-render → effect
	// fires setBlockEditingMode → store changes → useSelect re-runs → …
	const templatePartChildrenKey = useSelect(
		( select ) => {
			const { getBlockOrder } = select( blockEditorStore );
			return serializeIds(
				templateParts.flatMap( ( clientId ) =>
					getBlockOrder( clientId )
				)
			);
		},
		[ templateParts ]
	);
	const templatePartChildren = useMemo(
		() => deserializeIds( templatePartChildrenKey ),
		[ templatePartChildrenKey ]
	);

	const registry = useRegistry();

	// The effects below are split so that changes to one group of blocks
	// don't cause unnecessary set/unset cycles for the others. For example,
	// the root block ('') editing mode only needs to be set once.
	// Child blocks of templates and templateParts are also loaded separately,
	// so these are kept in separate effects.
	useEffect( () => {
		const {
			setBlockEditingMode,
			unsetBlockEditingMode,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		__unstableMarkNextChangeAsNotPersistent();
		setBlockEditingMode( '', 'disabled' );

		return () => {
			__unstableMarkNextChangeAsNotPersistent();
			unsetBlockEditingMode( '' );
		};
	}, [ registry ] );

	useEffect( () => {
		const {
			setBlockEditingMode,
			unsetBlockEditingMode,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		registry.batch( () => {
			for ( const clientId of templateParts ) {
				__unstableMarkNextChangeAsNotPersistent();
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of templateParts ) {
					__unstableMarkNextChangeAsNotPersistent();
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ templateParts, registry ] );

	useLayoutEffect( () => {
		if ( ! templateSectionIds.length ) {
			return;
		}

		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );
		const { getBlockListSettings } = registry.select( blockEditorStore );
		const { updateBlockListSettings } =
			registry.dispatch( blockEditorStore );
		const previousSettings = {};
		const nextSettings = {};

		for ( const clientId of templateSectionIds ) {
			const currentSettings = getBlockListSettings( clientId );
			previousSettings[ clientId ] = currentSettings ?? null;
			nextSettings[ clientId ] = {
				...( currentSettings ?? {} ),
				templateLock: 'contentOnly',
			};
		}

		// Universal canvas prototype behavior: mark top-level template-owned
		// blocks as section roots. The explicit block editing mode keeps them
		// selectable even though the root is disabled, while the block list
		// contentOnly lock lets the existing section/spotlight selectors treat
		// them like editable global areas.
		registry.batch( () => {
			for ( const clientId of templateSectionIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
			updateBlockListSettings( nextSettings );
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of templateSectionIds ) {
					unsetBlockEditingMode( clientId );
				}
				updateBlockListSettings( previousSettings );
			} );
		};
	}, [ templateSectionIds, registry ] );

	useEffect( () => {
		const {
			setBlockEditingMode,
			unsetBlockEditingMode,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		const contentOnlySet = new Set( contentOnlyIds );

		registry.batch( () => {
			for ( const clientId of contentOnlyIds ) {
				__unstableMarkNextChangeAsNotPersistent();
				setBlockEditingMode( clientId, 'contentOnly' );
			}
			if ( ! isUniversalCanvas ) {
				for ( const clientId of templatePartChildren ) {
					if ( ! contentOnlySet.has( clientId ) ) {
						__unstableMarkNextChangeAsNotPersistent();
						setBlockEditingMode( clientId, 'disabled' );
					}
				}
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of contentOnlyIds ) {
					__unstableMarkNextChangeAsNotPersistent();
					unsetBlockEditingMode( clientId );
				}
				if ( ! isUniversalCanvas ) {
					for ( const clientId of templatePartChildren ) {
						if ( ! contentOnlySet.has( clientId ) ) {
							__unstableMarkNextChangeAsNotPersistent();
							unsetBlockEditingMode( clientId );
						}
					}
				}
			} );
		};
	}, [ contentOnlyIds, isUniversalCanvas, templatePartChildren, registry ] );

	return null;
}
