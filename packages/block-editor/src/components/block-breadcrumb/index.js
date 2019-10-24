/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the hierarchy of the current block selection as a breadcrumb.
 *
 * @return {WPElement} Block Breadcrumb.
 */
const BlockBreadcrumb = function() {
	const { selectBlock, clearSelectedBlock } = useDispatch( 'core/block-editor' );
	const { clientId, parents, hasSelection } = useSelect( ( select ) => {
		const {
			getSelectionStart,
			getSelectedBlockClientId,
			getBlockParents,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			parents: getBlockParents( selectedBlockClientId ),
			clientId: selectedBlockClientId,
			hasSelection: getSelectionStart(),
		};
	}, [] );

	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	return (
		<nav aria-label={ __( 'Blocks breadcrumb' ) }>
			<ul className="block-editor-block-breadcrumb" role="list">
				<li>
					<Button
						className="block-editor-block-breadcrumb__button"
						isTertiary
						onClick={ hasSelection ? clearSelectedBlock : null }
						aria-current={ hasSelection ? false : 'true' }
					>
						{ __( 'Document' ) }
					</Button>
				</li>
				{ parents.map( ( parentClientId ) => (
					<li key={ parentClientId }>
						<Button
							className="block-editor-block-breadcrumb__button"
							isTertiary
							onClick={ () => selectBlock( parentClientId ) }
						>
							<BlockTitle clientId={ parentClientId } />
						</Button>
					</li>
				) ) }
				{ !! clientId && (
					<li className="block-editor-block-breadcrumb__current" aria-current="true">
						<BlockTitle clientId={ clientId } />
					</li>
				) }
			</ul>
		</nav>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
};

export default BlockBreadcrumb;
