/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockNavigationTree from './tree';

const noop = () => {};

export default function BlockNavigation( {
	onSelect = noop,
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
