/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InnerBlocks } from '@wordpress/block-editor';

function CustomAppender() {
	return <InnerBlocks.ButtonBlockAppender isToggle />;
}

const addNavigationEditorCustomAppender = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}

		return <BlockEdit { ...props } customAppender={ CustomAppender } />;
	},
	'withNavigationEditorCustomAppender'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-navigation-editor-custom-appender',
		addNavigationEditorCustomAppender
	);
