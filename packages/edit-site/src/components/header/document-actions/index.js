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
import { VisuallyHidden } from '@wordpress/components';

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
	} = useSelect( ( select ) => {
		return {
			selectedBlock: select( 'core/block-editor' ).getSelectedBlock(),
			getBlockParentsByBlockName: select( 'core/block-editor' )
				.getBlockParentsByBlockName,
			getBlockWithoutInnerBlocks: select( 'core/block-editor' )
				.__unstableGetBlockWithoutInnerBlocks,
		};
	} );

	// Check if current block is a template part:
	const selectedBlockLabel =
		selectedBlock?.name === 'core/template-part'
			? getBlockDisplayText( selectedBlock )
			: null;

	if ( selectedBlockLabel ) {
		return {
			label: selectedBlockLabel,
			isActive: true,
		};
	}

	// Check if an ancestor of the current block is a template part:
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
		return {
			label: getBlockDisplayText( closestParent ),
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
					<h1 className="edit-site-document-actions__title-wrapper">
						<VisuallyHidden>
							{ __( 'Edit template:' ) }
						</VisuallyHidden>
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
					</h1>
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
