/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ExternalLink, Tooltip } from '@wordpress/components';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';
import { Icon, globe, info, linkOff } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';

import useRichUrlData from './use-rich-url-data';
import useEntityData from './use-entity-data';
import { ICONS_MAP } from './constants';

export default function LinkPreview( {
	value,
	hasRichPreviews = false,
	hasUnlinkControl = false,
	onRemove,
	additionalControls,
} ) {
	// Only use the image if the type is a media attachment.
	const showRichDataImage = value?.type === 'attachment';

	// Avoid fetching if rich previews are not desired.
	const showRichPreviews = hasRichPreviews ? value?.url : null;

	const { richData, isFetching: isFetchingRichURLData } =
		useRichUrlData( showRichPreviews );

	const { entityData, isFetching: isFetchingEntityData } = useEntityData(
		value?.type,
		value?.id
	);

	const isFetching = isFetchingRichURLData || isFetchingEntityData;

	// Rich data may be an empty object so test for that.
	const hasRichData =
		( richData && Object.keys( richData ).length ) ||
		( entityData && Object.keys( entityData ).length );

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';

	const displayTitle = stripHTML(
		entityData?.title?.rendered || richData?.title || displayURL
	);

	// url can be undefined if the href attribute is unset
	const isEmptyURL = ! value?.url?.length;

	let icon;

	if ( entityData?.type ) {
		icon = <Icon icon={ ICONS_MAP[ entityData.type ] } />;
	} else if ( richData?.icon ) {
		icon = <img src={ richData?.icon } alt="" />;
	} else if ( isEmptyURL ) {
		icon = <Icon icon={ info } size={ 32 } />;
	} else {
		icon = <Icon icon={ globe } />;
	}

	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-current': true,
				'is-rich': hasRichData,
				'is-fetching': !! isFetching,
				'is-preview': true,
				'is-error': isEmptyURL,
				'is-url-title': displayTitle === displayURL,
			} ) }
		>
			<div className="block-editor-link-control__search-item-top">
				<span className="block-editor-link-control__search-item-header">
					<span
						className={ classnames(
							'block-editor-link-control__search-item-icon',
							{
								'is-image': richData?.icon,
							}
						) }
					>
						{ icon }
					</span>
					<span className="block-editor-link-control__search-item-details">
						{ ! isEmptyURL ? (
							<>
								<Tooltip
									text={ value.url }
									placement="bottom-start"
								>
									<ExternalLink
										className="block-editor-link-control__search-item-title"
										href={ value.url }
									>
										{ displayTitle }
									</ExternalLink>
								</Tooltip>

								{ ( entityData?.slug ||
									( value?.url &&
										displayTitle !== displayURL ) ) && (
									<span className="block-editor-link-control__search-item-info">
										{ filterURLForDisplay(
											'/' + entityData?.slug
										) || displayURL }
									</span>
								) }
							</>
						) : (
							<span className="block-editor-link-control__search-item-error-notice">
								{ __( 'Link is empty' ) }
							</span>
						) }
					</span>
				</span>

				{ hasUnlinkControl && (
					<Button
						icon={ linkOff }
						label={ __( 'Unlink' ) }
						className="block-editor-link-control__search-item-action block-editor-link-control__unlink"
						onClick={ onRemove }
						iconSize={ 24 }
					/>
				) }
				<ViewerSlot fillProps={ value } />
			</div>

			{ !! (
				hasRichData &&
				showRichDataImage &&
				( richData?.image || isFetching )
			) && (
				<div className="block-editor-link-control__search-item-bottom">
					{ ( richData?.image || isFetching ) && (
						<div
							aria-hidden={ ! richData?.image }
							className={ classnames(
								'block-editor-link-control__search-item-image',
								{
									'is-placeholder': ! richData?.image,
								}
							) }
						>
							{ richData?.image && (
								<img src={ richData?.image } alt="" />
							) }
						</div>
					) }
				</div>
			) }

			{ additionalControls && additionalControls() }
		</div>
	);
}
