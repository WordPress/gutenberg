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
 * Override the default edit UI to include a new block options menu item
 * to toggle the block's inspector controls open.
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
				aria-disabled={ isOpen }
			>
				{ __( 'Block settings' ) }
			</MenuItem>
		</BlockSettingsMenuFirstItem>
	);
};

addFilter(
	'editor.BlockEdit',
	'core/editor/with-block-settings-inspector-toggle',
	withBlockSettingsInspectorToggle
);
