import clsx from 'clsx';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components -- This migration intentionally adopts the shared Breadcrumb component.
import { Breadcrumb } from '@wordpress/ui';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useBlockElementRef } from '../block-list/use-block-props/use-block-refs';
import getEditorRegion from '../../utils/get-editor-region';
import { getBlockDisplayTitle } from '../block-title/use-block-display-title';

/**
 * Block breadcrumb component, displaying the hierarchy of the current block selection as a breadcrumb.
 *
 * @param {Object} props                 Component props.
 * @param {string} [props.rootLabelText] Translated label for the root element of the breadcrumb trail.
 * @param {string} [props.className]     Additional class name for the breadcrumb navigation.
 * @return {React.JSX.Element}           Block Breadcrumb.
 */
function BlockBreadcrumb( { rootLabelText, className } ) {
	const { selectBlock, clearSelectedBlock } = useDispatch( blockEditorStore );
	const { clientId, parents, currentTitle } = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectionStart,
			getEnabledBlockParents,
		} = unlock( select( blockEditorStore ) );
		const selectedBlockClientId =
			getSelectedBlockClientId() || getSelectionStart().clientId;
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
	const rootLabel =
		typeof rootLabelText === 'string' && rootLabelText.trim()
			? rootLabelText
			: _x( 'Document', 'noun, breadcrumb' );
	const blockRef = useRef();
	useBlockElementRef( clientId, blockRef );

	return (
		<Breadcrumb.Root
			className={ clsx( 'block-editor-block-breadcrumb', className ) }
			aria-label={ __( 'Block breadcrumb' ) }
		>
			{ !! clientId &&
				!! currentTitle && [
					<Breadcrumb.ButtonItem
						key="document"
						onClick={ () => {
							const editorRegion = getEditorRegion(
								blockRef.current?.closest(
									'.editor-styles-wrapper'
								)
							);
							clearSelectedBlock();
							editorRegion?.focus();
						} }
					>
						{ rootLabel }
					</Breadcrumb.ButtonItem>,
					parents.map(
						( parentClientId, index ) =>
							parentTitles[ index ] && (
								<Breadcrumb.ButtonItem
									key={ parentClientId }
									onClick={ () =>
										selectBlock( parentClientId )
									}
								>
									{ parentTitles[ index ] }
								</Breadcrumb.ButtonItem>
							)
					),
				] }
			<Breadcrumb.CurrentItem
				key={ clientId || 'document' }
				aria-current="true"
			>
				{ currentTitle || rootLabel }
			</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

export default BlockBreadcrumb;
