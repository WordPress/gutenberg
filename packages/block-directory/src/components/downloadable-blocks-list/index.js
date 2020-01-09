/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import DownloadableBlockNotice from '../downloadable-block-notice';

const DOWNLOAD_ERROR_NOTICE_ID = 'block-download-error';
const INSTALL_ERROR_NOTICE_ID = 'block-install-error';

function DownloadableBlocksList( {
	items,
	onHover = noop,
	children,
	isLoading,
	errorNotices,
	installAndDownloadBlock,
} ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-directory-downloadable-blocks-list">
			{ items &&
				items.map( ( item ) => (
					<DownloadableBlockListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icons={ item.icons }
						onClick={ () => {
							installAndDownloadBlock( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						item={ item }
						notice={ <DownloadableBlockNotice onRetry={ installAndDownloadBlock } errorNotices={ errorNotices } block={ item } /> }
						isLoading={ isLoading }
					/>
				) ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getErrorNotices,
			isInstalling,
		} = select( 'core/block-directory' );

		const errorNotices = getErrorNotices();
		const isLoading = isInstalling();

		return {
			errorNotices,
			isLoading,
		};
	} ),
	withDispatch( ( dispatch, props ) => {
		const {
			downloadBlock,
			installBlock,
			setErrorNotice,
			clearErrorNotice
		} = dispatch( 'core/block-directory' );
		const { onSelect } = props;

		return {
			installAndDownloadBlock: ( item ) => {
				clearErrorNotice( item.id );

				const onSuccess = () => {
					const onDownloadError = () => {
						setErrorNotice( item.id, DOWNLOAD_ERROR_NOTICE_ID );
					};

					const onDownloadSuccess = () => {
						onSelect( item );
					};

					downloadBlock( item, onDownloadSuccess, onDownloadError );
				};

				const onInstallBlockError = () => {
					setErrorNotice( item.id, INSTALL_ERROR_NOTICE_ID );
				};

				installBlock( item, onSuccess, onInstallBlockError );
			},
		};
	} )
)( DownloadableBlocksList );
