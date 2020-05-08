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
import {
	DOWNLOAD_ERROR_NOTICE_ID,
	INSTALL_ERROR_NOTICE_ID,
} from '../../store/constants';

/**
 * Returns either installAndDownload or download function.
 *
 * @param {Object} item The block item.
 * @param {Object} errorNotices An object with errors. Ie: "my-block/block : block-download-error"
 * @param {Function} installAndDownload The function that installs and downloads the block.
 * @param {Function} download The function that downloads the block.
 *
 * @return {Function} Function to continue install process.
 */
const getNoticeCallback = (
	item,
	errorNotices,
	installAndDownload,
	download
) => {
	// We don't want to try installing again, the API will throw an install error
	if (
		errorNotices[ item.id ] &&
		errorNotices[ item.id ] === DOWNLOAD_ERROR_NOTICE_ID
	) {
		return download;
	}

	return installAndDownload;
};

export function DownloadableBlocksList( {
	items,
	onHover = noop,
	children,
	isLoading,
	errorNotices,
	installAndDownload,
	download,
} ) {
	if ( ! items.length ) {
		return null;
	}

	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-directory-downloadable-blocks-list">
			{ items.map( ( item ) => {
				const callBack = getNoticeCallback(
					item,
					errorNotices,
					installAndDownload,
					download
				);

				return (
					<DownloadableBlockListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icons={ item.icons }
						onClick={ () => {
							callBack( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						item={ item }
						isLoading={ isLoading }
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default compose(
	withSelect( ( select ) => {
		const { getErrorNotices, isInstalling } = select(
			'core/block-directory'
		);

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
			clearErrorNotice,
			setIsInstalling,
		} = dispatch( 'core/block-directory' );
		const { onSelect } = props;

		const download = ( item ) => {
			clearErrorNotice( item.id );
			setIsInstalling( true );

			const onDownloadError = () => {
				setErrorNotice( item.id, DOWNLOAD_ERROR_NOTICE_ID );
				setIsInstalling( false );
			};

			const onDownloadSuccess = () => {
				onSelect( item );
				setIsInstalling( false );
			};

			downloadBlock( item, onDownloadSuccess, onDownloadError );
		};

		const install = ( item, onSuccess ) => {
			clearErrorNotice( item.id );
			setIsInstalling( true );

			const onInstallBlockError = () => {
				setErrorNotice( item.id, INSTALL_ERROR_NOTICE_ID );
				setIsInstalling( false );
			};

			installBlock( item, onSuccess, onInstallBlockError );
		};

		return {
			installAndDownload( item ) {
				const onSuccess = () => {
					download( item );
				};

				install( item, onSuccess );
			},
			download,
		};
	} )
)( DownloadableBlocksList );
