import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';

function IsolatedEditButton( {
	attributes = {},
	onNavigateToEntityRecord,
	isTemplatePartBlock,
} ) {
	const { ref, theme, slug } = attributes;
	const entityId = isTemplatePartBlock
		? theme && slug && `${ theme }//${ slug }`
		: ref;

	const handleClick = () => {
		if ( ! entityId ) {
			return;
		}

		onNavigateToEntityRecord( {
			postId: entityId,
			postType: isTemplatePartBlock ? 'wp_template_part' : 'wp_block',
		} );
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
				disabled={ ! entityId }
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

	const {
		block,
		onNavigateToEntityRecord,
		canEdit,
		isUniversalCanvas,
		isUniversalCanvasTemplateSection,
	} = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockListSettings,
				getSettings,
				canEditBlock,
			} = select( blockEditorStore );
			const settings = getSettings();
			return {
				block: getBlock( clientId ),
				onNavigateToEntityRecord: settings.onNavigateToEntityRecord,
				canEdit: canEditBlock( clientId ),
				isUniversalCanvas: settings.__experimentalUniversalCanvas,
				isUniversalCanvasTemplateSection:
					settings.__experimentalUniversalCanvas &&
					getBlockListSettings( clientId )?.templateLock ===
						'contentOnly',
			};
		},
		[ clientId ]
	);

	if ( ! canEdit || ( ! isWithinSection && ! isWithinEditedSection ) ) {
		return null;
	}

	const isTemplatePartBlock = isTemplatePart( block );
	const isNavigationOverlayTemplatePart =
		block?.attributes?.area === 'navigation-overlay' ||
		block?.attributes?.slug === 'overlay' ||
		block?.attributes?.slug?.includes( 'overlay' );
	const shouldEditTemplatePartInline =
		isUniversalCanvas &&
		isTemplatePartBlock &&
		! isNavigationOverlayTemplatePart;
	if ( shouldEditTemplatePartInline || isUniversalCanvasTemplateSection ) {
		return null;
	}
	const isSyncedPattern = isReusableBlock( block );
	const shouldUseIsolatedEditor =
		( isSyncedPattern ||
			( isTemplatePartBlock && ! shouldEditTemplatePartInline ) ) &&
		onNavigateToEntityRecord;

	if ( shouldUseIsolatedEditor ) {
		return (
			<IsolatedEditButton
				attributes={ block?.attributes }
				onNavigateToEntityRecord={ onNavigateToEntityRecord }
				isTemplatePartBlock={ isTemplatePartBlock }
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
