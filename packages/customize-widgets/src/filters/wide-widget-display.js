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
			wp.customize.Widgets.data.availableWidgets.find(
				( widget ) => widget.id_base === idBase
			)?.is_wide ?? false;

		return <BlockEdit key="edit" { ...props } isWide={ isWide } />;
	},
	'withWideWidgetDisplay'
);

addFilter(
	'editor.BlockEdit',
	'core/customize-widgets/wide-widget-display',
	withWideWidgetDisplay
);
