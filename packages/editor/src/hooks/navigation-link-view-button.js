/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__unstableBlockToolbarLastItem as BlockToolbarLastItem,
	store as blockEditorStore,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

// Target blocks that should have the View button.
const SUPPORTED_BLOCKS = [ 'core/navigation-link', 'core/navigation-submenu' ];

/**
 * Component that renders the View button for navigation blocks.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.attributes Block attributes.
 * @return {JSX.Element|null} The View button component or null if not applicable.
 */
function NavigationViewButton( { attributes } ) {
	const { kind, id, type } = attributes;
	const blockEditingMode = useBlockEditingMode();

	const onNavigateToEntityRecord = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().onNavigateToEntityRecord,
		[]
	);

	const onViewPage = useCallback( () => {
		if (
			kind === 'post-type' &&
			type === 'page' &&
			id &&
			onNavigateToEntityRecord
		) {
			onNavigateToEntityRecord( {
				postId: id,
				postType: type,
			} );
		}
	}, [ kind, id, type, onNavigateToEntityRecord ] );

	// Only show for page-type links, when navigation is available, and when in contentOnly mode.
	if (
		kind !== 'post-type' ||
		type !== 'page' ||
		! id ||
		! onNavigateToEntityRecord ||
		blockEditingMode !== 'contentOnly'
	) {
		return null;
	}

	return (
		<BlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton
					name="view"
					title={ __( 'View' ) }
					onClick={ onViewPage }
				>
					{ __( 'View' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockToolbarLastItem>
	);
}

/**
 * Higher-order component that adds the View button to navigation blocks.
 */
const withNavigationViewButton = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isSupportedBlock = SUPPORTED_BLOCKS.includes( props.name );

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ props.isSelected && isSupportedBlock && (
					<NavigationViewButton { ...props } />
				) }
			</>
		);
	},
	'withNavigationViewButton'
);

// Register the filter.
addFilter(
	'editor.BlockEdit',
	'core/editor/with-navigation-view-button',
	withNavigationViewButton
);
