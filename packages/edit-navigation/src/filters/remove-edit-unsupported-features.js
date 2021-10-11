/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const removeNavigationBlockEditUnsupportedFeatures = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name === 'core/navigation' ) {
			return (
				<BlockEdit
					{ ...props }
					hasSubmenuIndicatorSetting={ false }
					hasItemJustificationControls={ false }
					hasColorSettings={ false }
				/>
			);
		} else if ( props.name === 'core/navigation-link' ) {
			return <BlockEdit { ...props } allowPlaceholderLabels={ false } />;
		}

		return <BlockEdit { ...props } />;
	},
	'removeNavigationBlockEditUnsupportedFeatures'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/remove-navigation-block-edit-unsupported-features',
		removeNavigationBlockEditUnsupportedFeatures
	);
