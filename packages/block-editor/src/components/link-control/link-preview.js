/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ExternalLink } from '@wordpress/components';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';

import { Icon, globe } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';

import useRemoteUrlData from './use-remote-url-data';

export default function LinkPreview( { value, onEditClick } ) {
	const { richData, isFetching } = useRemoteUrlData( value?.url );

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';
	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			aria-selected="true"
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-current': true,
				'is-rich': richData,
				'is-fetching': isFetching,
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
						<p className="block-editor-link-control__search-item-description">
							{ richData.description }
						</p>
					) }
				</div>
			) }
		</div>
	);
}
