/**
 * WordPress dependencies
 */
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function EditContents( { clientId } ) {
	const { editContentOnlySection, stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);
	const { isWithinSection, isWithinEditedSection, editedContentOnlySection } =
		useSelect(
			( select ) => {
				const {
					isSectionBlock,
					getParentSectionBlock,
					getEditedContentOnlySection,
					isWithinEditedContentOnlySection,
				} = unlock( select( blockEditorStore ) );

				return {
					isWithinSection:
						isSectionBlock( clientId ) ||
						!! getParentSectionBlock( clientId ),
					isWithinEditedSection:
						isWithinEditedContentOnlySection( clientId ),
					editedContentOnlySection: getEditedContentOnlySection(),
				};
			},
			[ clientId ]
		);

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
					? __( 'Exit pattern' )
					: __( 'Edit pattern' ) }
			</Button>
		</VStack>
	);
}
