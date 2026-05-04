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
 *
 * The root is set to `disabled` to prevent top-level structural edits, and
 * each template part is explicitly set to `default` so it punches through
 * the root's disabled cascade and stays selectable. The descendants of each
 * template part are handled by the section-block inference, which fully
 * locks them by default (matching synced-pattern behavior) until the user
 * opts in via the "Edit" affordance.
 *
 * Note: zoom-out template-part visibility is also enforced by the reducer's
 * zoom-out branch (template parts get `default` mode), so template editing
 * matches this component's effect on List View even though this component
 * isn't mounted there. See `derivedBlockEditingModes` in the block-editor
 * reducer.
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

	const registry = useRegistry();

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
				setBlockEditingMode( clientId, 'default' );
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

		registry.batch( () => {
			for ( const clientId of contentOnlyIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of contentOnlyIds ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ contentOnlyIds, registry ] );

	return null;
}
