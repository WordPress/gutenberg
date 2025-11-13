/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';

export default function EditContents( { clientId } ) {
	const {
		isWithinSection,
		isWithinEditedSection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	if ( ! isWithinSection && ! isWithinEditedSection ) {
		return null;
	}

	return (
		<VStack className="block-editor-block-inspector-edit-contents" expanded>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () => {
					if ( ! editedContentOnlySection ) {
						editContentOnlySection( clientId );
					} else {
						stopEditingContentOnlySection();
					}
				} }
			>
				{ editedContentOnlySection
					? __( 'Exit section' )
					: __( 'Edit section' ) }
			</Button>
		</VStack>
	);
}
