import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';
import { canUserEditEntityRecordKey } from '../../store/private-keys';

/**
 * The entity a synced pattern or template part block renders, which "Edit
 * original" navigates to. The ID is missing while the block is unresolved.
 *
 * @param {Object} block Block.
 * @return {?{postType: string, postId: (number|string|undefined)}} The entity, or null for other blocks.
 */
function getOriginalEntity( block ) {
	if (
		! block ||
		( ! isReusableBlock( block ) && ! isTemplatePart( block ) )
	) {
		return null;
	}

	if ( isTemplatePart( block ) ) {
		const { theme, slug } = block.attributes;
		return {
			postType: 'wp_template_part',
			postId: theme && slug ? `${ theme }//${ slug }` : undefined,
		};
	}

	return { postType: 'wp_block', postId: block.attributes.ref };
}

function IsolatedEditButton( { entity, onNavigateToEntityRecord } ) {
	const handleClick = () => {
		if ( ! entity.postId ) {
			return;
		}

		onNavigateToEntityRecord( entity );
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
				accessibleWhenDisabled
				disabled={ ! entity.postId }
			>
				{ __( 'Edit original' ) }
			</Button>
		</Stack>
	);
}

function InlineEditButton( {
	clientId,
	editedContentOnlySection,
	editContentOnlySection,
	stopEditingContentOnlySection,
} ) {
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

export default function EditContents( { clientId } ) {
	const {
		isWithinSection,
		isWithinEditedSection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { block, onNavigateToEntityRecord, canEdit, canEditOriginal } =
		useSelect(
			( select ) => {
				const { getBlock, getSettings, canEditBlock } =
					select( blockEditorStore );
				const _block = getBlock( clientId );
				const settings = getSettings();
				const entity = getOriginalEntity( _block );
				const canUserEditEntity =
					settings[ canUserEditEntityRecordKey ];

				return {
					block: _block,
					onNavigateToEntityRecord: settings.onNavigateToEntityRecord,
					canEdit: canEditBlock( clientId ),
					// Without a permission check, as in a standalone block editor, assume the user can edit.
					canEditOriginal:
						! entity?.postId ||
						! canUserEditEntity ||
						!! canUserEditEntity( select, entity ),
				};
			},
			[ clientId ]
		);

	if ( ! canEdit || ( ! isWithinSection && ! isWithinEditedSection ) ) {
		return null;
	}

	const originalEntity = getOriginalEntity( block );

	if ( originalEntity && onNavigateToEntityRecord ) {
		// The user may use the block but not change what it renders.
		if ( ! canEditOriginal ) {
			return null;
		}

		return (
			<IsolatedEditButton
				entity={ originalEntity }
				onNavigateToEntityRecord={ onNavigateToEntityRecord }
			/>
		);
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
