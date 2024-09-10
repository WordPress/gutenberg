/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __unstableBlockSettingsMenuFirstItem as BlockSettingsMenuFirstItem } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a partial syncing controls to supported blocks in the pattern editor.
 * Currently, only the `core/paragraph` block is supported.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withBlockSettingsInspectorToggle = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && <BlockInspectorToggle /> }
			</>
		);
	},
	'withBlockSettingsInspectorToggle'
);

const BlockInspectorToggle = () => {
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const isOpen = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea( 'core' ) ===
			'edit-post/block',
		[]
	);

	return (
		<BlockSettingsMenuFirstItem>
			<MenuItem
				onClick={ () => {
					enableComplementaryArea( 'core', 'edit-post/block' );
				} }
				icon={ isRTL() ? drawerLeft : drawerRight }
				disabled={ isOpen }
			>
				{ __( 'Open Block settings' ) }
			</MenuItem>
		</BlockSettingsMenuFirstItem>
	);
};

addFilter(
	'editor.BlockEdit',
	'core/editor/with-block-settings-inspector-toggle',
	withBlockSettingsInspectorToggle
);
