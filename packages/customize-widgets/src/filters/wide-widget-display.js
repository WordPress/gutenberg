/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const { wp } = window;

const withWideWidgetDisplay = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { idBase } = props.attributes;
		const isWide =
			wp && wp.customize
				? wp.customize.Widgets.data.availableWidgets.filter(
						( widget ) => widget.id_base === idBase
				  )[ 0 ]?.is_wide
				: false;

		return <BlockEdit { ...props } isWide={ isWide } />;
	},
	'withWideWidgetDisplay'
);

addFilter(
	'editor.BlockEdit',
	'core/customize-widgets/wide-widget-display',
	withWideWidgetDisplay
);
