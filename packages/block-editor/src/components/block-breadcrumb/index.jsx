import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { Breadcrumb } from '@wordpress/ui';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useBlockElementRef } from '../block-list/use-block-props/use-block-refs';
import getEditorRegion from '../../utils/get-editor-region';
import getBlockDisplayTitle from '../block-title/get-block-display-title';

/**
 * Block breadcrumb component, displaying the hierarchy of the current block selection as a breadcrumb.
 *
 * @param {Object} props               Component props.
 * @param {string} props.rootLabelText Translated label for the root element of the breadcrumb trail.
 * @return {Element}                   Block Breadcrumb.
 */
function BlockBreadcrumb( { rootLabelText } ) {
	const { selectBlock, clearSelectedBlock } = useDispatch( blockEditorStore );
	const { clientId, parents, currentTitle } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getEnabledBlockParents } = unlock(
			select( blockEditorStore )
		);
		const selectedBlockClientId = getSelectedBlockClientId();
		return {
			clientId: selectedBlockClientId,
			parents: getEnabledBlockParents( selectedBlockClientId ),
			currentTitle: getBlockDisplayTitle(
				select,
				selectedBlockClientId,
				'breadcrumb'
			),
		};
	}, [] );
	const parentTitles = useSelect(
		( select ) =>
			parents.map( ( parentClientId ) =>
				getBlockDisplayTitle( select, parentClientId, 'breadcrumb' )
			),
		[ parents ]
	);

	// translators: Default label for the document in the block breadcrumb.
	const rootLabel = rootLabelText || _x( 'Document', 'noun, breadcrumb' );
	const blockRef = useRef();
	useBlockElementRef( clientId, blockRef );

	return (
		<Breadcrumb.Root
			className="block-editor-block-breadcrumb"
			aria-label={ __( 'Block breadcrumb' ) }
		>
			{ !! clientId &&
				!! currentTitle && [
					<Breadcrumb.LinkItem
						href="#"
						key="document"
						className="block-editor-block-breadcrumb__button"
						onClick={ ( event ) => {
							event.preventDefault();
							const blockEditor = blockRef.current?.closest(
								'.editor-styles-wrapper'
							);
							clearSelectedBlock();
							getEditorRegion( blockEditor )?.focus();
						} }
					>
						{ rootLabel }
					</Breadcrumb.LinkItem>,
					parents.map(
						( parentClientId, index ) =>
							parentTitles[ index ] && (
								<Breadcrumb.LinkItem
									key={ parentClientId }
									className="block-editor-block-breadcrumb__button"
									href={ `#block-${ parentClientId }` }
									onClick={ ( event ) => {
										event.preventDefault();
										selectBlock( parentClientId );
									} }
								>
									{ parentTitles[ index ] }
								</Breadcrumb.LinkItem>
							)
					),
				] }
			<Breadcrumb.CurrentItem
				key={ clientId || 'document' }
				className="block-editor-block-breadcrumb__current"
				aria-current="true"
			>
				{ currentTitle || rootLabel }
			</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

export default BlockBreadcrumb;
