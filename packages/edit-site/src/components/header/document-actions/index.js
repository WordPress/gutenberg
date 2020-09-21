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

function useSecondaryText() {
	const {
		selectedBlock,
		hoveredBlockIds,
		getBlockName,
		getBlock,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlock,
			getHoveredBlocks,
			getBlockName: _getBlockName,
			getBlock: _getBlock,
		} = select( 'core/block-editor' );
		return {
			selectedBlock: getSelectedBlock(),
			hoveredBlockIds: getHoveredBlocks(),
			getBlockName: _getBlockName,
			getBlock: _getBlock,
		};
	} );

	// Go through hovered blocks and see if one is of interest.
	const hoveredTemplatePartBlockId = hoveredBlockIds.find(
		( blockId ) => getBlockName( blockId ) === 'core/template-part'
	);
	const hoveredTemplatePartBlock = getBlock( hoveredTemplatePartBlockId );
	const hoveredLabel = hoveredTemplatePartBlock
		? getBlockLabel(
				getBlockType( hoveredTemplatePartBlock.name ),
				hoveredTemplatePartBlock.attributes
		  )
		: '';

	// TODO: Handle if parent is template part too.
	const selectedBlockLabel =
		selectedBlock?.name === 'core/template-part'
			? getBlockLabel(
					getBlockType( selectedBlock?.name ),
					selectedBlock?.attributes
			  )
			: null;

	if ( hoveredLabel || selectedBlockLabel ) {
		return {
			label: hoveredLabel || selectedBlockLabel,
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
							'edit-site-document-actions__label',
							'edit-site-document-actions__title',
							{
								'is-active': isTitleActive,
							}
						) }
					>
						{ documentTitle }
					</div>
					<div
						className={ classnames(
							'edit-site-document-actions__label',
							'edit-site-document-actions__secondary-item',
							{
								'is-active': isActive,
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
