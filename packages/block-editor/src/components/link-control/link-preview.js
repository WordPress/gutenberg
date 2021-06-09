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

import useRemoteUrlData from './use-remote-url-data';

export default function LinkPreview( { value, onEditClick } ) {
	const { richData, isFetching } = useRemoteUrlData( value?.url );

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
			{ ( richData?.image || richData?.description ) && (
				<div className="block-editor-link-control__search-item-bottom">
					{ richData?.image && (
						<img
							className="block-editor-link-control__search-item-image"
							src={ richData?.image }
							alt=""
						/>
					) }
					{ richData?.description && (
						<Text
							className="block-editor-link-control__search-item-description"
							truncate
							numberOfLines="2"
						>
							{ richData.description }
						</Text>
					) }
				</div>
			) }
		</div>
	);
}
