/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useUnsupportedBlocks } from '../utils';

const modalDescriptionId =
	'wp-block-query-enhanced-pagination-modal__description';

/**
 * Function that takes an array of block titles and returns a formatted
 * string with commas and 'and'.
 *
 * @param {Array} unsupportedBlocksList Array of unsupported blocks.
 * @return {string} The formated list.
 */

const formatUnsupportedBlocksList = ( unsupportedBlocksList ) => {
	if ( unsupportedBlocksList.length === 0 ) return '';
	if ( unsupportedBlocksList.length === 1 ) return unsupportedBlocksList[ 0 ];
	const andWord = __( 'and' );
	if ( unsupportedBlocksList.length === 2 )
		return unsupportedBlocksList.join( ' ' + andWord + ' ' );

	const lastItem = unsupportedBlocksList.pop();
	return unsupportedBlocksList.join( ', ' ) + ', ' + andWord + ' ' + lastItem;
};

export default function EnhancedPaginationModal( {
	clientId,
	attributes: { enhancedPagination },
	setAttributes,
} ) {
	const [ isOpen, setOpen ] = useState( false );
	const {
		hasBlocksFromPlugins,
		hasPostContentBlock,
		hasUnsupportedBlocks,
		unsupportedBlocksList,
	} = useUnsupportedBlocks( clientId );

	useEffect( () => {
		if (
			enhancedPagination &&
			hasUnsupportedBlocks &&
			! window.__experimentalFullPageClientSideNavigation
		) {
			setAttributes( { enhancedPagination: false } );
			setOpen( true );
		}
	}, [ enhancedPagination, hasUnsupportedBlocks, setAttributes ] );

	const closeModal = () => {
		setOpen( false );
	};

	let notice = _n(
		'If you still want to prevent full page reloads, remove that block, then disable "Force page reload" again in the Query Block settings.',
		'If you still want to prevent full page reloads, remove those blocks, then disable "Force page reload" again in the Query Block settings.',
		unsupportedBlocksList.length
	);
	if ( hasBlocksFromPlugins ) {
		notice =
			_n( 'The ', 'The ', unsupportedBlocksList.length ) +
			formatUnsupportedBlocksList( unsupportedBlocksList ) +
			_n(
				' block present inside the query block does not explicity support avoiding full page reloads.',
				' blocks present inside the query block do not explicity support avoiding full page reloads.',
				unsupportedBlocksList.length
			) +
			' ' +
			notice;
	} else if ( hasPostContentBlock ) {
		notice =
			__(
				'Currently, avoiding full page reloads is not possible when a Content block is present inside the Query block.'
			) +
			' ' +
			notice;
	}

	return (
		isOpen && (
			<Modal
				title={ __( 'Query block: Force page reload enabled' ) }
				className="wp-block-query__enhanced-pagination-modal"
				aria={ {
					describedby: modalDescriptionId,
				} }
				role="alertdialog"
				focusOnMount="firstElement"
				isDismissible={ false }
				onRequestClose={ closeModal }
			>
				<VStack alignment="right" spacing={ 5 }>
					<span id={ modalDescriptionId }>{ notice }</span>
					<Button
						// TODO: Switch to `true` (40px size) if possible
						__next40pxDefaultSize={ false }
						variant="primary"
						onClick={ closeModal }
					>
						{ __( 'OK' ) }
					</Button>
				</VStack>
			</Modal>
		)
	);
}
