/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	ExternalLink,
	__experimentalText as Text,
} from '@wordpress/components';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';
import { Icon, globe, info, linkOff, edit } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';

import useRichUrlData from './use-rich-url-data';

export default function LinkPreview( {
	value,
	onEditClick,
	hasRichPreviews = false,
	hasUnlinkControl = false,
	onRemove,
} ) {
	// Avoid fetching if rich previews are not desired.
	const showRichPreviews = hasRichPreviews ? value?.url : null;

	const { richData, isFetching } = useRichUrlData( showRichPreviews );

	// Rich data may be an empty object so test for that.
	const hasRichData = richData && Object.keys( richData ).length;

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';

	const displayTitle = richData?.title || value?.title || displayURL;

	// url can be undefined if the href attribute is unset
	const isEmptyURL = ! value?.url?.length;

	let icon;

	if ( richData?.icon ) {
		icon = <img src={ richData?.icon } alt="" />;
	} else if ( isEmptyURL ) {
		icon = <Icon icon={ info } size={ 32 } />;
	} else {
		icon = <Icon icon={ globe } />;
	}

	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			aria-selected="true"
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-current': true,
				'is-rich': hasRichData,
				'is-fetching': !! isFetching,
				'is-preview': true,
				'is-error': isEmptyURL,
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
								<ExternalLink
									className="block-editor-link-control__search-item-title"
									href={ value.url }
								>
									{ stripHTML( displayTitle ) }
								</ExternalLink>

								{ value?.url && (
									<span className="block-editor-link-control__search-item-info">
										{ displayURL }
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

				<Button
					icon={ edit }
					label={ __( 'Edit' ) }
					className="block-editor-link-control__search-item-action"
					onClick={ onEditClick }
					iconSize={ 24 }
				/>
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

			{ ( ( hasRichData &&
				( richData?.image || richData?.description ) ) ||
				isFetching ) && (
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

					{ ( richData?.description || isFetching ) && (
						<div
							aria-hidden={ ! richData?.description }
							className={ classnames(
								'block-editor-link-control__search-item-description',
								{
									'is-placeholder': ! richData?.description,
								}
							) }
						>
							{ richData?.description && (
								<Text truncate numberOfLines="2">
									{ richData.description }
								</Text>
							) }
						</div>
					) }
				</div>
			) }
		</div>
	);
}
