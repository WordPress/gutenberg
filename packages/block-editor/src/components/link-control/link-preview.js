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
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { Icon, globe } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';
import { store as blockEditorStore } from '../../store';

export default function LinkPreview( { value, onEditClick } ) {
	const [ richData, setRichData ] = useState( {} );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	useEffect( () => {
		const fetchRichData = async () => {
			const urlData = await fetchRemoteUrlData( value.url );
			setRichData( urlData );
		};

		if ( value?.url?.length ) {
			fetchRichData();
		}
	}, [ value ] );

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';

	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			aria-selected="true"
			className={ classnames( 'block-editor-link-control__search-item', {
				'is-current': true,
			} ) }
		>
			<div className="block-editor-link-control__search-item-top">
				<span className="block-editor-link-control__search-item-header">
					{ richData?.icon ? (
						<img
							className="block-editor-link-control__search-item-icon is-image"
							src={ richData?.icon }
							alt=""
						/>
					) : (
						<Icon
							className="block-editor-link-control__search-item-icon"
							icon={ globe }
						/>
					) }
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
