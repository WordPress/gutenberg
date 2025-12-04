/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';

export default function EditContents( { clientId } ) {
	const {
		isWithinSection,
		isWithinEditedSection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { block, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	if ( ! isWithinSection && ! isWithinEditedSection ) {
		return null;
	}

	const blockAttributes = block?.attributes || {};

	// Synced patterns and template parts should navigate to the isolated editor
	const isSyncedPattern = isReusableBlock( block );
	const isTemplatePartBlock = isTemplatePart( block );
	const shouldNavigateToIsolatedEditor =
		( isSyncedPattern || isTemplatePartBlock ) && onNavigateToEntityRecord;

	const handleClick = () => {
		if ( ! editedContentOnlySection ) {
			if ( shouldNavigateToIsolatedEditor ) {
				// Navigate to isolated editor for synced patterns and template parts
				if ( isSyncedPattern ) {
					onNavigateToEntityRecord( {
						postId: blockAttributes.ref,
						postType: 'wp_block',
					} );
				} else if ( isTemplatePartBlock ) {
					const { theme, slug } = blockAttributes;
					const templatePartId =
						theme && slug ? `${ theme }//${ slug }` : null;
					if ( templatePartId ) {
						onNavigateToEntityRecord( {
							postId: templatePartId,
							postType: 'wp_template_part',
						} );
					}
				}
			} else {
				// Use spotlight mode for unsynced patterns
				editContentOnlySection( clientId );
			}
		} else {
			stopEditingContentOnlySection();
		}
	};

	return (
		<VStack className="block-editor-block-inspector-edit-contents" expanded>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleClick }
			>
				{ editedContentOnlySection
					? __( 'Exit section' )
					: __( 'Edit section' ) }
			</Button>
		</VStack>
	);
}
