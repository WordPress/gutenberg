/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationTree from './tree';

export default function BlockNavigation( {
	onSelect = () => {},
	__experimentalFeatures,
} ) {
	return (
		<div className="block-editor-block-navigation__container">
			<p className="block-editor-block-navigation__label">
				{ __( 'List view' ) }
			</p>

			<BlockNavigationTree
				onSelect={ onSelect }
				showNestedBlocks
				showOnlyCurrentHierarchy
				__experimentalFeatures={ __experimentalFeatures }
			/>
		</div>
	);
}
