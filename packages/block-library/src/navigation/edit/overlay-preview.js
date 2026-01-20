/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../../template-part/edit/utils/create-template-part-id';

/**
 * Component that displays a read-only visual preview of the selected overlay template part.
 *
 * @param {Object} props              Component props.
 * @param {string} props.overlay      The overlay template part slug.
 * @param {string} props.currentTheme The current theme stylesheet name.
 * @return {JSX.Element|null} The overlay preview component or null if no overlay is selected.
 */
export default function OverlayPreview( { overlay, currentTheme } ) {
	const templatePartId = useMemo( () => {
		if ( ! overlay || ! currentTheme ) {
			return null;
		}
		return createTemplatePartId( currentTheme, overlay );
	}, [ currentTheme, overlay ] );

	const { content, editedBlocks, hasResolved, recordExists } = useSelect(
		( select ) => {
			if ( ! templatePartId ) {
				return {
					content: null,
					editedBlocks: null,
					hasResolved: true,
					recordExists: false,
				};
			}

			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );

			const editedRecord = getEditedEntityRecord(
				'postType',
				'wp_template_part',
				templatePartId,
				{ context: 'view' }
			);

			return {
				content: editedRecord?.content,
				editedBlocks: editedRecord?.blocks,
				hasResolved: hasFinishedResolution( 'getEditedEntityRecord', [
					'postType',
					'wp_template_part',
					templatePartId,
					{ context: 'view' },
				] ),
				recordExists: !! editedRecord,
			};
		},
		[ templatePartId ]
	);

	const blocks = useMemo( () => {
		if ( ! templatePartId ) {
			return null;
		}

		if ( editedBlocks && editedBlocks.length > 0 ) {
			return editedBlocks;
		}

		if ( content && typeof content === 'string' ) {
			return parse( content );
		}

		return [];
	}, [ templatePartId, editedBlocks, content ] );

	if ( ! overlay ) {
		return null;
	}

	if ( ! hasResolved ) {
		return (
			<div className="wp-block-navigation__overlay-preview-loading">
				<Spinner />
			</div>
		);
	}

	// Show message if the overlay template part has been deleted.
	if ( hasResolved && ! recordExists ) {
		return (
			<div className="wp-block-navigation__overlay-preview-empty">
				{ __( 'This overlay template part no longer exists.' ) }
			</div>
		);
	}

	if ( ! blocks || blocks.length === 0 ) {
		return (
			<div className="wp-block-navigation__overlay-preview-empty">
				{ __( 'This overlay is empty.' ) }
			</div>
		);
	}

	return (
		<div
			className="wp-block-navigation__overlay-preview"
			aria-label={ __( 'Navigation Overlay template part preview' ) }
			role="region"
		>
			<BlockPreview.Async
				placeholder={
					<div className="wp-block-navigation__overlay-preview-placeholder" />
				}
			>
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ 400 }
					minHeight={ 200 }
				/>
			</BlockPreview.Async>
		</div>
	);
}
