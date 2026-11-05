import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import usePostContentBlockTypes from './use-post-content-block-types';

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 *
 * @param {Object}   props                           Component props.
 * @param {string[]} [props.contentBlockTypes]       The blocks that hold the content being edited. Defaults to the post content blocks, which is what a page is edited through. Pass a list to edit something else through other blocks, such as a template rendered inside another, whose only slot is the post content block of the template around it. Must be a stable value.
 * @param {string}   [props.templatePartEditingMode] The editing mode of the template parts outside the content being edited. Defaults to `contentOnly`, which is how a page shows the template parts of its template. A template rendered inside another passes `disabled`: the template parts of the template around it belong to that template, which is edited on its own screen, and with the template parts of the template being edited treated as sections, a `contentOnly` one would offer to edit a section that has nothing editable in it.
 */
export default function DisableNonPageContentBlocks( {
	contentBlockTypes,
	templatePartEditingMode = 'contentOnly',
} ) {
	const defaultBlockTypes = usePostContentBlockTypes();
	const postContentBlockTypes = contentBlockTypes ?? defaultBlockTypes;
	const { contentOnlyIds, templateParts } = useSelect(
		( select ) => {
			const { getPostBlocksByName, getTemplatePartsOutsidePostBlocks } =
				unlock( select( editorStore ) );
			return {
				contentOnlyIds: getPostBlocksByName( postContentBlockTypes ),
				// A template part inside the content being edited, such as
				// one in a template rendered inside the template around it,
				// is left to the editing modes it has in that template on
				// its own, rather than locked with the template around it.
				templateParts: getTemplatePartsOutsidePostBlocks(
					postContentBlockTypes
				),
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
				setBlockEditingMode( clientId, templatePartEditingMode );
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
	}, [ templateParts, templatePartEditingMode, registry ] );

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
