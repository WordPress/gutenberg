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
import { Icon, globe } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';

import useRichUrlData from './use-rich-url-data';

export default function LinkPreview( {
	value,
	onEditClick,
	hasRichPreviews = false,
} ) {
	// Avoid fetching if rich previews are not desired.
	const maybeRemoteURL = hasRichPreviews ? value?.url : null;

	const { richData, isFetching } = useRichUrlData( maybeRemoteURL );

	// Rich data may be an empty object so test for that.
	const hasRichData = richData && Object.keys( richData ).length;

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';
	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			aria-selected="true"
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-current': true,
				'is-rich': hasRichData,
				'is-fetching': !! isFetching,
				'is-preview': true,
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
						{ richData?.icon ? (
							<img src={ richData?.icon } alt="" />
						) : (
							<Icon icon={ globe } />
						) }
					</span>
					<span className="block-editor-link-control__search-item-details">
						<ExternalLink
							className="block-editor-link-control__search-item-title"
							href={ value.url }
						>
							{ richData?.title || value?.title || displayURL }
						</ExternalLink>
						{ value?.url && (
							<span className="block-editor-link-control__search-item-info">
								{ displayURL }
							</span>
						) }
					</span>
				</span>

				<Button
					variant="secondary"
					onClick={ () => onEditClick() }
					className="block-editor-link-control__search-item-action"
				>
					{ __( 'Edit' ) }
				</Button>
				<ViewerSlot fillProps={ value } />
			</div>

			{ ( hasRichData || isFetching ) && (
				<div className="block-editor-link-control__search-item-bottom">
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
				</div>
			) }
		</div>
	);
}
