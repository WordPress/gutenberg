import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
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

	// The modes currently applied by this component, so that a change to the
	// block tree only dispatches for the blocks that actually changed. The
	// selectors return a new array whenever the tree changes, even when the
	// client IDs are identical, and an unset/set cycle would briefly expose a
	// `disabled` post content block. That flips `inert` on its wrapper, which
	// blurs whatever is focused inside it.
	const appliedModesRef = useRef( new Map() );

	useEffect( () => {
		const {
			setBlockEditingMode,
			unsetBlockEditingMode,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		const nextModes = new Map();
		for ( const clientId of contentOnlyIds ) {
			nextModes.set( clientId, 'contentOnly' );
		}
		for ( const clientId of templatePartChildren ) {
			if ( ! nextModes.has( clientId ) ) {
				nextModes.set( clientId, 'disabled' );
			}
		}

		const previousModes = appliedModesRef.current;
		appliedModesRef.current = nextModes;

		registry.batch( () => {
			for ( const clientId of previousModes.keys() ) {
				if ( ! nextModes.has( clientId ) ) {
					__unstableMarkNextChangeAsNotPersistent();
					unsetBlockEditingMode( clientId );
				}
			}
			for ( const [ clientId, mode ] of nextModes ) {
				if ( previousModes.get( clientId ) !== mode ) {
					__unstableMarkNextChangeAsNotPersistent();
					setBlockEditingMode( clientId, mode );
				}
			}
		} );
	}, [ contentOnlyIds, templatePartChildren, registry ] );

	// Unset on unmount only. Dependency changes are reconciled above.
	useEffect( () => {
		return () => {
			const {
				unsetBlockEditingMode,
				__unstableMarkNextChangeAsNotPersistent,
			} = registry.dispatch( blockEditorStore );

			registry.batch( () => {
				for ( const clientId of appliedModesRef.current.keys() ) {
					__unstableMarkNextChangeAsNotPersistent();
					unsetBlockEditingMode( clientId );
				}
			} );
			appliedModesRef.current = new Map();
		};
	}, [ registry ] );

	return null;
}
