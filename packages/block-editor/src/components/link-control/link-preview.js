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

export default function LinkPreview( {
	value,
	hasRichPreviews = false,
	hasUnlinkControl = false,
	onRemove,
	additionalControls,
} ) {
	// Avoid fetching if rich previews are not desired.
	const showRichPreviews = hasRichPreviews ? value?.url : null;

	const { richData, isFetching } = useRichUrlData( showRichPreviews );

	// Rich data may be an empty object so test for that.
	const hasRichData = richData && Object.keys( richData ).length;

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';

	// url can be undefined if the href attribute is unset
	const isEmptyURL = ! value?.url?.length;

	const displayTitle =
		! isEmptyURL &&
		stripHTML( richData?.title || value?.title || displayURL );

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

								{ value?.url && displayTitle !== displayURL && (
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

			{ additionalControls && additionalControls() }
		</div>
	);
}
