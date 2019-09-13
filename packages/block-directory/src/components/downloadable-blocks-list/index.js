/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName, unregisterBlockType } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';

const DOWNLOAD_ERROR_NOTICE_ID = 'block-download-error';
const INSTALL_ERROR_NOTICE_ID = 'block-install-error';

function DownloadableBlocksList( { items, onHover = noop, children, downloadAndInstallBlock } ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-directory-downloadable-blocks-list">
			{ items && items.map( ( item ) =>
				<DownloadableBlockListItem
					key={ item.id }
					className={ getBlockMenuDefaultClassName( item.id ) }
					icons={ item.icons }
					onClick={ () => {
						downloadAndInstallBlock( item );
						onHover( null );
					} }
					onFocus={ () => onHover( item ) }
					onMouseEnter={ () => onHover( item ) }
					onMouseLeave={ () => onHover( null ) }
					onBlur={ () => onHover( null ) }
					item={ item }
				/>
			) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default compose(
	withDispatch( ( dispatch, props ) => {
		const { installBlock, downloadBlock } = dispatch( 'core/block-directory' );
		const { createErrorNotice, removeNotice } = dispatch( 'core/notices' );
		const { removeBlocks } = dispatch( 'core/block-editor' );
		const { onSelect } = props;

		return {
			downloadAndInstallBlock: ( item ) => {
				const onDownloadError = () => {
					createErrorNotice(
						__( 'Block previews can’t load.' ),
						{
							id: DOWNLOAD_ERROR_NOTICE_ID,
							actions: [
								{
									label: __( 'Retry' ),
									onClick: () => {
										removeNotice( DOWNLOAD_ERROR_NOTICE_ID );
										downloadBlock( item, onSuccess, onDownloadError );
									},
								},
							],
						} );
				};

				const onSuccess = () => {
					const createdBlock = onSelect( item );

					const onInstallBlockError = () => {
						createErrorNotice(
							__( 'Block previews can\'t install.' ),
							{
								id: INSTALL_ERROR_NOTICE_ID,
								actions: [
									{
										label: __( 'Retry' ),
										onClick: () => {
											removeNotice( INSTALL_ERROR_NOTICE_ID );
											installBlock( item, noop, onInstallBlockError );
										},
									},
									{
										label: __( 'Remove' ),
										onClick: () => {
											removeNotice( INSTALL_ERROR_NOTICE_ID );
											removeBlocks( createdBlock.clientId );
											unregisterBlockType( item.name );
										},
									},
								],
							}
						);
					};

					installBlock( item, noop, onInstallBlockError );
				};

				downloadBlock( item, onSuccess, onDownloadError );
			},
		};
	} ),
)( DownloadableBlocksList );
