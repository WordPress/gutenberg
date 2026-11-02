import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';
import type { InlineEditButtonProps } from './types';

function InlineEditButton( {
	clientId,
	editedContentOnlySection,
	editContentOnlySection,
	stopEditingContentOnlySection,
}: InlineEditButtonProps ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const handleClick = () => {
		if ( ! editedContentOnlySection ) {
			editContentOnlySection( clientId );
			selectBlock( clientId );
		} else {
			stopEditingContentOnlySection();
			// Keep the selected section pattern or content block selected after exiting.
			selectBlock( clientId );
		}
	};

	return (
		<Stack
			direction="column"
			className="block-editor-block-inspector-edit-contents"
		>
			<Button
				className="block-editor-block-inspector-edit-contents__button"
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleClick }
			>
				{ editedContentOnlySection
					? /* translators: Button label to leave pattern editing mode. */
						__( 'Exit pattern' )
					: /* translators: Button label to enter pattern editing mode. */
						__( 'Edit pattern' ) }
			</Button>
		</Stack>
	);
}

export default function EditContents( { clientId }: { clientId: string } ) {
	const {
		isWithinSection,
		isWithinEditedSection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { block, canEdit } = useSelect(
		( select ) => {
			const { getBlock, canEditBlock } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
				canEdit: canEditBlock( clientId ),
			};
		},
		[ clientId ]
	);

	if ( ! canEdit || ( ! isWithinSection && ! isWithinEditedSection ) ) {
		return null;
	}

	// Synced patterns and template parts are never edited inline. They're
	// edited through the entity they render, whose "Edit original" button the
	// blocks fill into PrivateBlockInspectorEditOriginal.
	if ( isReusableBlock( block ) || isTemplatePart( block ) ) {
		return null;
	}

	return (
		<InlineEditButton
			clientId={ clientId }
			editedContentOnlySection={ editedContentOnlySection }
			editContentOnlySection={ editContentOnlySection }
			stopEditingContentOnlySection={ stopEditingContentOnlySection }
		/>
	);
}
