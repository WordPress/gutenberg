/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __unstableBlockToolbarLastItem as BlockToolbarLastItem } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { settings as settingsIcon } from '@wordpress/icons';
import { store as interfaceStore } from '@wordpress/interface';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a partial syncing controls to supported blocks in the pattern editor.
 * Currently, only the `core/paragraph` block is supported.
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withBlockToolbar = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && <BlockSidebarToggle /> }
			</>
		);
	},
	'withBlockToolbar'
);

const BlockSidebarToggle = () => {
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const isSelected = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea( 'core' ) ===
			'edit-post/block',
		[]
	);

	return (
		<BlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton
					icon={ settingsIcon }
					label={ __( 'Toggle block settings' ) }
					isPressed={ isSelected }
					onClick={ () => {
						if ( isSelected ) {
							disableComplementaryArea(
								'core',
								'edit-post/block'
							);
						} else {
							enableComplementaryArea(
								'core',
								'edit-post/block'
							);
						}
					} }
				/>
			</ToolbarGroup>
		</BlockToolbarLastItem>
	);
};

addFilter(
	'editor.BlockEdit',
	'core/editor/with-block-toolbar',
	withBlockToolbar
);
