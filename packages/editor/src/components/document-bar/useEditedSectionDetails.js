/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Hook to get details about the currently edited content-only section.
 * Only returns information when the content only pattern insertion experiment is enabled.
 *
 * @return {Object|null} Object with patternName, patternTitle, and type, or null if no section is being edited or experiment is disabled.
 */
export default function useEditedSectionDetails() {
	return useSelect( ( select ) => {
		const {
			getBlockAttributes,
			getBlockName,
			__experimentalGetParsedPattern,
		} = select( blockEditorStore );
		const { getEditedEntityRecord, getCurrentTheme } = select( coreStore );
		const { getEditedContentOnlySection } = unlock(
			select( blockEditorStore )
		);

		// Get the clientId of the unlocked pattern/section
		const editedSectionId = getEditedContentOnlySection();
		if ( ! editedSectionId ) {
			return null;
		}

		const attributes = getBlockAttributes( editedSectionId );

		// Handle unsynced patterns (contentOnly patterns with patternName)
		const patternName = attributes?.metadata?.patternName;
		if ( patternName ) {
			// Get pattern details if available
			const pattern =
				typeof __experimentalGetParsedPattern === 'function'
					? __experimentalGetParsedPattern( patternName )
					: null;

			return {
				patternName,
				patternTitle: pattern?.title || attributes?.metadata?.name,
				type: 'pattern',
			};
		}

		const blockName = getBlockName( editedSectionId );

		// Handle synced patterns (core/block)
		if ( blockName === 'core/block' && !! attributes?.ref ) {
			const entity = getEditedEntityRecord(
				'postType',
				'wp_block',
				attributes.ref
			);
			if ( entity?.title ) {
				return {
					patternName: attributes.ref,
					patternTitle: decodeEntities( entity.title ),
					type: 'synced-pattern',
				};
			}
		}

		// Handle template parts (core/template-part)
		if ( blockName === 'core/template-part' && !! attributes?.slug ) {
			const theme = attributes.theme || getCurrentTheme()?.stylesheet;
			const templatePartId = theme
				? `${ theme }//${ attributes.slug }`
				: null;
			if ( templatePartId ) {
				const entity = getEditedEntityRecord(
					'postType',
					'wp_template_part',
					templatePartId
				);
				if ( entity?.title ) {
					return {
						patternName: attributes.slug,
						patternTitle: decodeEntities( entity.title ),
						type: 'template-part',
					};
				}
			}
		}

		return null;
	}, [] );
}
