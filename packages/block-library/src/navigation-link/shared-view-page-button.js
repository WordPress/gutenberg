/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { useBlockEditingMode } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalVStack as VStack, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Shared View Page button component for Navigation blocks
 *
 * @param {Object} props - Component props
 * @param {Object} props.attributes - Block attributes containing kind, id, type
 * @param {string} props.variant - Button variant (default: 'secondary')
 * @param {string} props.className - Additional CSS class
 * @param {Object} props.style - Additional inline styles
 */
export function ViewPageButton( {
	attributes,
	variant = 'secondary',
	className = 'navigation-link-view-page-button',
	style = {},
} ) {
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
		<VStack spacing={ 4 }>
			<Button
				__next40pxDefaultSize
				variant={ variant }
				onClick={ onViewPage }
				className={ className }
				style={ style }
			>
				{ __( 'View Page' ) }
			</Button>
		</VStack>
	);
}

/**
 * View Page button for toolbar (smaller variant)
 */
export function ViewPageToolbarButton( { attributes } ) {
	return (
		<ViewPageButton
			attributes={ attributes }
			variant="tertiary"
			className="navigation-view-page-toolbar-button"
		/>
	);
}

/**
 * View Page button for sidebar (full width variant)
 */
export function ViewPageSidebarButton( { attributes } ) {
	return (
		<ViewPageButton
			attributes={ attributes }
			variant="secondary"
			className="navigation-link-view-page-button"
			style={ {
				display: 'block',
				width: '100%',
				textAlign: 'center',
			} }
		/>
	);
}
