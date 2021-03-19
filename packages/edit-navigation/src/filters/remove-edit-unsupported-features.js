/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const removeNavigationBlockEditUnsupportedFeatures = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<BlockEdit
				{ ...props }
				hasSubmenuIndicatorSetting={ false }
				hasItemJustificationControls={ false }
				hasListViewModal={ false }
			/>
		);
	},
	'removeNavigationBlockEditUnsupportedFeatures'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/remove-navigation-block-edit-unsupported-features',
		removeNavigationBlockEditUnsupportedFeatures
	);
