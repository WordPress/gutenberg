/**
 * WordPress dependencies
 */
import { edit } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const BlockEditButton = ( { label, clientId } ) => {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const [ convertModalOpen, setConvertModalOpen ] = useState( false );
	const { totalPages } = usePageData();
	const MAX_PAGE_COUNT = 100;

	const block = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);

	const onClick = () => {
		toggleBlockHighlight( clientId, true );
		setConvertModalOpen( ! convertModalOpen );
	};

	const allowConvertToLinks =
		'core/page-list' === block.name && totalPages <= MAX_PAGE_COUNT;

	return (
		<>
			{ convertModalOpen && (
				<ConvertToLinksModal
					onClose={ () => setConvertModalOpen( false ) }
					clientId={ clientId }
				/>
			) }
			{ allowConvertToLinks && (
				<Button icon={ edit } label={ label } onClick={ onClick } />
			) }
		</>
	);
};

export default BlockEditButton;
