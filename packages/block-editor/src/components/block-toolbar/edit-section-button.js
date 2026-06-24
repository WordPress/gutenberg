/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';

export default function EditSectionButton( { clientId } ) {
	const {
		isSectionBlock,
		isWithinEditedSection,
		isEditingContentOnlySection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );
	const [ isWarningModalOpen, setIsWarningModalOpen ] = useState( false );

	const sectionClientId = editedContentOnlySection || clientId;

	const {
		blockType,
		isGlobalSection,
		isTemplatePartBlock,
		warningKey,
		hasSeenWarning,
	} = useSelect(
		( select ) => {
			if ( ! sectionClientId ) {
				return {};
			}
			const {
				getBlockAttributes,
				getBlockListSettings,
				getBlockName,
				getSettings,
			} = select( blockEditorStore );
			const settings = getSettings();
			const blockName = getBlockName( sectionClientId );
			const attributes = getBlockAttributes( sectionClientId );
			const _blockType = blockName ? { name: blockName } : null;
			const _isTemplatePartBlock = isTemplatePart( _blockType );
			const isNavigationOverlayTemplatePart =
				attributes?.area === 'navigation-overlay' ||
				attributes?.slug === 'overlay' ||
				attributes?.slug?.includes( 'overlay' );
			const isTemplateSection =
				!! settings.__experimentalUniversalCanvas &&
				getBlockListSettings( sectionClientId )?.templateLock ===
					'contentOnly';
			const _isGlobalSection =
				!! settings.__experimentalUniversalCanvas &&
				( ( _isTemplatePartBlock &&
					! isNavigationOverlayTemplatePart ) ||
					isTemplateSection );
			const _warningKey = _isTemplatePartBlock
				? 'universalCanvasTemplatePartWarning'
				: 'universalCanvasTemplateWarning';

			return {
				blockType: _blockType,
				isGlobalSection: _isGlobalSection,
				isTemplatePartBlock: _isTemplatePartBlock,
				warningKey: _warningKey,
				hasSeenWarning: select( preferencesStore ).get(
					'core/edit-site',
					_warningKey
				),
			};
		},
		[ sectionClientId ]
	);
	const { set: setPreference } = useDispatch( preferencesStore );

	// Synced patterns and normal template parts already have their own
	// isolated-editor toolbar buttons ("Edit original"). Universal canvas
	// template parts are the exception: they use this button so the user can
	// opt into editing the shared element inline.
	// Note: isSectionBlock returns false while the section is being edited,
	// so we also check isEditingContentOnlySection to show "Exit pattern".
	if (
		! clientId ||
		( ! isSectionBlock &&
			! isEditingContentOnlySection &&
			! isWithinEditedSection ) ||
		isReusableBlock( blockType ) ||
		( isTemplatePart( blockType ) && ! isGlobalSection )
	) {
		return null;
	}

	if (
		isGlobalSection &&
		isWithinEditedSection &&
		! isEditingContentOnlySection
	) {
		return null;
	}

	const isEditing = isEditingContentOnlySection || isWithinEditedSection;

	const startEditing = () => {
		editContentOnlySection( sectionClientId );
	};

	const handleClick = () => {
		if ( isEditing ) {
			stopEditingContentOnlySection();
			return;
		}

		if ( isGlobalSection && ! hasSeenWarning ) {
			setIsWarningModalOpen( true );
		} else {
			startEditing();
		}
	};

	const handleConfirmEdit = () => {
		setPreference( 'core/edit-site', warningKey, true );
		setIsWarningModalOpen( false );
		startEditing();
	};

	const modalTitle = isTemplatePartBlock
		? __( 'Edit shared site element?' )
		: __( 'Edit shared layout?' );
	const modalDescription = isTemplatePartBlock
		? __(
				'This element can appear in more than one place, so changes you make here may affect other pages.'
		  )
		: __(
				'This layout can be used by more than one item, so changes you make here may affect other content.'
		  );
	let buttonLabel;
	if ( isGlobalSection ) {
		buttonLabel = isEditing ? __( 'Back' ) : __( 'Edit' );
	} else {
		buttonLabel = isEditing
			? /* translators: Button label to leave pattern editing mode. */
			  __( 'Exit pattern' )
			: /* translators: Button label to enter pattern editing mode. */
			  __( 'Edit pattern' );
	}

	return (
		<ToolbarGroup>
			<ToolbarButton onClick={ handleClick }>
				{ buttonLabel }
			</ToolbarButton>
			{ isWarningModalOpen && (
				<Modal
					title={ modalTitle }
					onRequestClose={ () => setIsWarningModalOpen( false ) }
				>
					<p>{ modalDescription }</p>
					<div className="block-editor-edit-section-button__modal-actions">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => setIsWarningModalOpen( false ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ handleConfirmEdit }
						>
							{ __( 'Edit' ) }
						</Button>
					</div>
				</Modal>
			) }
		</ToolbarGroup>
	);
}
