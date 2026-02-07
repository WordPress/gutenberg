/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	PanelBody,
	Spinner,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { TemplateStyleVariationPicker } from '@wordpress/global-styles-ui';

/**
 * A panel component for selecting a style variation for the current template.
 *
 * This component is shown in the document settings sidebar when editing
 * a template. It allows users to assign a registered style variation to
 * the template, which will be used instead of the global styles when
 * that template is rendered.
 *
 * @return {Element|null} The panel element, or null if not editing a template.
 */
export default function TemplateStyleVariationPanel() {
	const {
		isTemplate,
		templateId,
		currentStyleVariationId,
		registeredVariations,
		isLoading,
		isExperimentEnabled,
	} = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const {
			getEditedEntityRecord,
			__experimentalGetRegisteredStyleVariations,
			hasFinishedResolution,
		} = select( coreStore );

		const postType = getCurrentPostType();
		const isTemplateType = postType === 'wp_template';

		if ( ! isTemplateType ) {
			return {
				isTemplate: false,
				templateId: null,
				currentStyleVariationId: null,
				registeredVariations: [],
				isLoading: false,
				isExperimentEnabled: false,
			};
		}

		const postId = getCurrentPostId();
		const template = getEditedEntityRecord(
			'postType',
			'wp_template',
			postId
		);

		// Get registered style variations.
		// If the selector doesn't exist, the experiment is not enabled.
		let variations = [];
		let experimentEnabled = false;
		try {
			if (
				typeof __experimentalGetRegisteredStyleVariations === 'function'
			) {
				variations = __experimentalGetRegisteredStyleVariations() || [];
				experimentEnabled = true;
			}
		} catch {
			// Selector might not exist if experiment is not enabled.
			variations = [];
		}

		const hasFinished = experimentEnabled
			? hasFinishedResolution?.(
					'__experimentalGetRegisteredStyleVariations',
					[]
			  ) ?? true
			: true;

		return {
			isTemplate: true,
			templateId: template?.id || postId,
			currentStyleVariationId: template?.style_variation || null,
			registeredVariations: variations,
			isLoading: ! hasFinished,
			isExperimentEnabled: experimentEnabled,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );

	const handleSelect = useCallback(
		( variationId ) => {
			// Update the template's style_variation meta.
			editEntityRecord( 'postType', 'wp_template', templateId, {
				style_variation: variationId,
			} );
		},
		[ templateId, editEntityRecord ]
	);

	// Don't render if not editing a template.
	if ( ! isTemplate ) {
		return null;
	}

	// Don't render if experiment is not enabled.
	if ( ! isExperimentEnabled ) {
		return null;
	}

	// Don't render if no variations are registered.
	if ( ! isLoading && registeredVariations.length === 0 ) {
		return null;
	}

	return (
		<PanelBody
			title={ __( 'Style Variation' ) }
			className="edit-site-template-style-variation-panel"
		>
			<VStack spacing={ 4 }>
				{ isLoading ? (
					<Spinner />
				) : (
					<>
						<Text>
							{ __(
								'Select a style variation to override global styles for this template.'
							) }
						</Text>
						<TemplateStyleVariationPicker
							currentStyleVariationId={ currentStyleVariationId }
							onSelect={ handleSelect }
							gap={ 3 }
						/>
					</>
				) }
			</VStack>
		</PanelBody>
	);
}
