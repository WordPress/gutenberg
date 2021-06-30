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
import { store as blockEditorStore } from '../../store';

/**
 * Block breadcrumb component, displaying the hierarchy of the current block selection as a breadcrumb.
 *
 * @param  {Object}   props               Component props.
 * @param  {string}   props.rootLabelText Translated label for the root element of the breadcrumb trail.
 * @return {WPElement}                    Block Breadcrumb.
 */
function BlockBreadcrumb( { rootLabelText } ) {
	const { selectBlock, clearSelectedBlock } = useDispatch( blockEditorStore );
	const { clientId, parents, hasSelection } = useSelect( ( select ) => {
		const {
			getSelectionStart,
			getSelectedBlockClientId,
			getBlockParents,
		} = select( blockEditorStore );
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			parents: getBlockParents( selectedBlockClientId ),
			clientId: selectedBlockClientId,
			hasSelection: !! getSelectionStart().clientId,
		};
	}, [] );
	const rootLabel = rootLabelText || __( 'Document' );

	/*
	 * Disable reason: The `list` ARIA role is redundant but
	 * Safari+VoiceOver won't announce the list otherwise.
	 */
	/* eslint-disable jsx-a11y/no-redundant-roles */
	return (
		<ul
			className="block-editor-block-breadcrumb"
			role="list"
			aria-label={ __( 'Block breadcrumb' ) }
		>
			<li
				className={
					! hasSelection
						? 'block-editor-block-breadcrumb__current'
						: undefined
				}
				aria-current={ ! hasSelection ? 'true' : undefined }
			>
				{ hasSelection && (
					<Button
						className="block-editor-block-breadcrumb__button"
						variant="tertiary"
						onClick={ clearSelectedBlock }
					>
						{ rootLabel }
					</Button>
				) }
				{ ! hasSelection && rootLabel }
			</li>
			{ parents.map( ( parentClientId ) => (
				<li key={ parentClientId }>
					<Button
						className="block-editor-block-breadcrumb__button"
						variant="tertiary"
						onClick={ () => selectBlock( parentClientId ) }
					>
						<BlockTitle clientId={ parentClientId } />
					</Button>
				</li>
			) ) }
			{ !! clientId && (
				<li
					className="block-editor-block-breadcrumb__current"
					aria-current="true"
				>
					<BlockTitle clientId={ clientId } />
				</li>
			) }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default BlockBreadcrumb;
