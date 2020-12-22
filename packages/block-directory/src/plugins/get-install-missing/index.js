/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import InstallButton from './install-button';
import { store as blockDirectoryStore } from '../../store';

const getInstallMissing = ( OriginalComponent ) => ( props ) => {
	const { originalName, originalUndelimitedContent } = props.attributes;
	// Disable reason: This is a valid component, but it's mistaken for a callback.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { block, hasPermission } = useSelect(
		( select ) => {
			const { getDownloadableBlocks } = select( blockDirectoryStore );
			const blocks = getDownloadableBlocks(
				'block:' + originalName
			).filter( ( { name } ) => originalName === name );
			return {
				hasPermission: select( 'core' ).canUser(
					'read',
					'block-directory/search'
				),
				block: blocks.length && blocks[ 0 ],
			};
		},
		[ originalName ]
	);

	const { replaceBlock } = useDispatch( 'core/block-editor' );
	const convertToHTML = () => {
		replaceBlock(
			props.clientId,
			createBlock( 'core/html', {
				content: originalUndelimitedContent,
			} )
		);
	};

	if ( ! hasPermission || ! block ) {
		return <OriginalComponent { ...props } />;
	}

	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );

	let messageHTML = sprintf(
		/* translators: %s: block name */
		__(
			'Your site doesn’t include support for the %s block. You can try installing the block or remove it entirely.'
		),
		block.title || originalName
	);
	const actions = [
		<InstallButton
			key="install"
			block={ block }
			attributes={ props.attributes }
			clientId={ props.clientId }
		/>,
	];

	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			/* translators: %s: block name */
			__(
				'Your site doesn’t include support for the %s block. You can try installing the block, convert it to a Custom HTML block, or remove it entirely.'
			),
			block.title || originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLink>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	}

	return (
		<>
			<Warning actions={ actions }>{ messageHTML }</Warning>
			<RawHTML>{ originalUndelimitedContent }</RawHTML>
		</>
	);
};

export default getInstallMissing;
