/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../downloadable-block-list-item';
import {
	DOWNLOAD_ERROR_NOTICE_ID,
	INSTALL_ERROR_NOTICE_ID,
} from '../../store/constants';

export function DownloadableBlocksList( {
	items,
	onHover = noop,
	children,
	install,
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
				return (
					<DownloadableBlockListItem
						key={ item.id }
						className={ getBlockMenuDefaultClassName( item.id ) }
						icons={ item.icons }
						onClick={ () => {
							install( item );
							onHover( null );
						} }
						onFocus={ () => onHover( item ) }
						onMouseEnter={ () => onHover( item ) }
						onMouseLeave={ () => onHover( null ) }
						onBlur={ () => onHover( null ) }
						item={ item }
					/>
				);
			} ) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default compose(
	withDispatch( ( dispatch, props, { select } ) => {
		const {
			downloadBlock,
			installBlock,
			setErrorNotice,
			clearErrorNotice,
			setIsInstalling,
		} = dispatch( 'core/block-directory' );
		const { onSelect } = props;
		const errorNotices = select( 'core/block-directory' ).getErrorNotices();

		const downloadAssets = ( item ) => {
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

		const installPlugin = ( item, onSuccess ) => {
			if (
				errorNotices[ item.id ] &&
				errorNotices[ item.id ] === DOWNLOAD_ERROR_NOTICE_ID
			) {
				// Install has already run & the error was in downloading the assets, so we
				// can skip the install step to prevent re-downloading the plugin.
				return onSuccess();
			}

			clearErrorNotice( item.id );
			setIsInstalling( true );

			const onInstallBlockError = () => {
				setErrorNotice( item.id, INSTALL_ERROR_NOTICE_ID );
				setIsInstalling( false );
			};

			installBlock( item, onSuccess, onInstallBlockError );
		};

		return {
			install( item ) {
				const onSuccess = () => {
					downloadAssets( item );
				};

				installPlugin( item, onSuccess );
			},
		};
	} )
)( DownloadableBlocksList );
