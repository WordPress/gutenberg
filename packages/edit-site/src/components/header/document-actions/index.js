/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { last } from 'lodash';

function getBlockDisplayText( block ) {
	return block
		? getBlockLabel( getBlockType( block.name ), block.attributes )
		: null;
}

function useSecondaryText() {
	const {
		selectedBlock,
		getBlockParentsByBlockName,
		getBlockWithoutInnerBlocks,
		hoveredTemplatePartBlockId,
		getBlock,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlock,
			getBlockParentsByBlockName: _getBlockParentsByBlockName,
			__unstableGetBlockWithoutInnerBlocks,
			__experimentalGetHoveredBlockIdByBlockName,
			getBlock: _getBlock,
		} = select( 'core/block-editor' );
		return {
			selectedBlock: getSelectedBlock(),
			getBlockParentsByBlockName: _getBlockParentsByBlockName,
			getBlockWithoutInnerBlocks: __unstableGetBlockWithoutInnerBlocks,
			hoveredTemplatePartBlockId: __experimentalGetHoveredBlockIdByBlockName(
				'core/template-part'
			),
			getBlock: _getBlock,
		};
	} );

	// Check if current block is a template part:
	const activeTemplatePart = {};
	activeTemplatePart.label =
		selectedBlock?.name === 'core/template-part'
			? getBlockDisplayText( selectedBlock )
			: null;
	activeTemplatePart.clientId =
		activeTemplatePart.label && selectedBlock?.clientId;
	// Check if an ancestor of the current block is a template part:
	if ( ! activeTemplatePart.label ) {
		const templatePartParents = !! selectedBlock
			? getBlockParentsByBlockName(
					selectedBlock?.clientId,
					'core/template-part'
			  )
			: [];

		if ( templatePartParents.length ) {
			// templatePartParents is in order from top to bottom, so the closest
			// parent is at the end.
			const closestParent = getBlockWithoutInnerBlocks(
				last( templatePartParents )
			);
			activeTemplatePart.label = getBlockDisplayText( closestParent );
			activeTemplatePart.clientId =
				activeTemplatePart.label && closestParent?.clientId;
		}
	}

	if ( hoveredTemplatePartBlockId ) {
		const hoveredBlockLabel = getBlockDisplayText(
			getBlock( hoveredTemplatePartBlockId )
		);
		return {
			label: hoveredBlockLabel,
			isActive:
				hoveredTemplatePartBlockId === activeTemplatePart.clientId,
		};
	}

	if ( activeTemplatePart.label ) {
		return {
			label: activeTemplatePart.label,
			isActive: true,
		};
	}

	return {};
}

export default function DocumentActions( { documentTitle } ) {
	const { label, isActive } = useSecondaryText();
	// Title is active when there is no secondary item, or when the secondary
	// item is inactive.
	const isTitleActive = ! label?.length || ! isActive;
	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
		>
			{ documentTitle ? (
				<>
					<div
						className={ classnames(
							'edit-site-document-actions__title',
							{
								'is-active': isTitleActive,
								'is-secondary-title-active': isActive,
							}
						) }
					>
						{ documentTitle }
					</div>
					<div
						className={ classnames(
							'edit-site-document-actions__secondary-item',
							{
								'is-secondary-title-active': isActive,
							}
						) }
					>
						{ label ?? '' }
					</div>
				</>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
