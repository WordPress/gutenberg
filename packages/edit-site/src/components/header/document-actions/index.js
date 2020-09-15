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
	const selectedBlock = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSelectedBlock();
	} );

	const selectedBlockLabel =
		selectedBlock?.name === 'core/template-part'
			? getBlockLabel(
					getBlockType( selectedBlock?.name ),
					selectedBlock?.attributes
			  )
			: null;

	if ( selectedBlockLabel ) {
		return {
			label: selectedBlockLabel,
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
		<div className="edit-site-document-actions">
			{ documentTitle ? (
				<>
					<span
						className={ classnames(
							'edit-site-document-actions__title',
							{
								'is-active': isTitleActive,
							}
						) }
					>
						{ documentTitle }
					</span>
					{ label && (
						<span
							className={ classnames(
								'edit-site-document-actions__secondary-item',
								{
									'is-active': isActive,
								}
							) }
						>
							{ label }
						</span>
					) }
				</>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
