/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPlaceholder from '../components/block-placeholder';

const addNavigationEditorPlaceholder = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<BlockEdit { ...props } customPlaceholder={ BlockPlaceholder } />
		);
	},
	'withNavigationEditorPlaceholder'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-navigation-editor-placeholder',
		addNavigationEditorPlaceholder
	);
