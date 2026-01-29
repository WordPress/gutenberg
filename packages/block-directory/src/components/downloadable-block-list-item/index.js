/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Tooltip,
	Spinner,
	VisuallyHidden,
	Composite,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockRatings from '../block-ratings';
import DownloadableBlockIcon from '../downloadable-block-icon';
import DownloadableBlockNotice from '../downloadable-block-notice';
import { store as blockDirectoryStore } from '../../store';

// Return the appropriate block item label, given the block data and status.
function getDownloadableBlockLabel(
	{ title, rating, ratingCount },
	{ hasNotice, isInstalled, isInstalling }
) {
	const stars = Math.round( rating / 0.5 ) * 0.5;

	if ( ! isInstalled && hasNotice ) {
		/* translators: %s: block title */
		return sprintf( 'Retry installing %s.', decodeEntities( title ) );
	}

	if ( isInstalled ) {
		/* translators: %s: block title */
		return sprintf( 'Add %s.', decodeEntities( title ) );
	}

	if ( isInstalling ) {
		/* translators: %s: block title */
		return sprintf( 'Installing %s.', decodeEntities( title ) );
	}

	// No ratings yet, just use the title.
	if ( ratingCount < 1 ) {
		/* translators: %s: block title */
		return sprintf( 'Install %s.', decodeEntities( title ) );
	}

	return sprintf(
		/* translators: 1: block title, 2: average rating, 3: total ratings count. */
		_n(
			'Install %1$s. %2$s stars with %3$s review.',
			'Install %1$s. %2$s stars with %3$s reviews.',
			ratingCount
		),
		decodeEntities( title ),
		stars,
		ratingCount
	);
}

function DownloadableBlockListItem( { item, onClick } ) {
	const { author, description, icon, rating, title } = item;
	// getBlockType returns a block object if this block exists, or null if not.
	const isInstalled = !! getBlockType( item.name );

	const { hasNotice, isInstalling, isInstallable } = useSelect(
		( select ) => {
			const { getErrorNoticeForBlock, isInstalling: isBlockInstalling } =
				select( blockDirectoryStore );
			const notice = getErrorNoticeForBlock( item.id );
			const hasFatal = notice && notice.isFatal;
			return {
				hasNotice: !! notice,
				isInstalling: isBlockInstalling( item.id ),
				isInstallable: ! hasFatal,
			};
		},
		[ item ]
	);

	let statusText = '';
	if ( isInstalled ) {
		statusText = __( 'Installed!' );
	} else if ( isInstalling ) {
		statusText = __( 'Installing…' );
	}

	const itemLabel = getDownloadableBlockLabel( item, {
		hasNotice,
		isInstalled,
		isInstalling,
	} );

	return (
		<Tooltip placement="top" text={ itemLabel }>
			<Composite.Item
				className={ clsx(
					'block-directory-downloadable-block-list-item',
					isInstalling && 'is-installing'
				) }
				accessibleWhenDisabled
				disabled={ isInstalling || ! isInstallable }
				onClick={ ( event ) => {
					event.preventDefault();
					onClick();
				} }
				aria-label={ itemLabel }
				type="button"
				role="option"
			>
				<div className="block-directory-downloadable-block-list-item__icon">
					<DownloadableBlockIcon icon={ icon } title={ title } />
					{ isInstalling ? (
						<span className="block-directory-downloadable-block-list-item__spinner">
							<Spinner />
						</span>
					) : (
						<BlockRatings rating={ rating } />
					) }
				</div>
				<span className="block-directory-downloadable-block-list-item__details">
					<span className="block-directory-downloadable-block-list-item__title">
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: block title. 2: author name. */
								__( '%1$s <span>by %2$s</span>' ),
								decodeEntities( title ),
								author
							),
							{
								span: (
									<span className="block-directory-downloadable-block-list-item__author" />
								),
							}
						) }
					</span>
					{ hasNotice ? (
						<DownloadableBlockNotice block={ item } />
					) : (
						<>
							<span className="block-directory-downloadable-block-list-item__desc">
								{ !! statusText
									? statusText
									: decodeEntities( description ) }
							</span>
							{ isInstallable &&
								! ( isInstalled || isInstalling ) && (
									<VisuallyHidden>
										{ __( 'Install block' ) }
									</VisuallyHidden>
								) }
						</>
					) }
				</span>
			</Composite.Item>
		</Tooltip>
	);
}

export default DownloadableBlockListItem;
