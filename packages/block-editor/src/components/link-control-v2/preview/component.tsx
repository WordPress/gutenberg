/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	ExternalLink,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';
import {
	Icon,
	globe,
	info,
	linkOff,
	pencil,
	copySmall,
} from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { useLinkControlV2Context } from '../context';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import useRichUrlData from '../../link-control/use-rich-url-data.js';
import { ViewerSlot } from '../../link-control/viewer-slot';

/**
 * Filters the title for display. Removes the protocol and www prefix.
 *
 * @param title The title to be filtered.
 * @return The filtered title.
 */
function filterTitleForDisplay( title: string ): string {
	// Derived from `filterURLForDisplay` in `@wordpress/url`.
	return title
		.replace( /^[a-z\-.\+]+[0-9]*:(\/\/)?/i, '' )
		.replace( /^www\./i, '' );
}

interface PreviewProps {
	/**
	 * Whether to fetch and display rich previews (metadata, icons, etc.).
	 */
	hasRichPreviews?: boolean;
	/**
	 * Whether to show the unlink/remove button.
	 */
	hasUnlinkControl?: boolean;
	/**
	 * Callback when the remove/unlink button is clicked.
	 */
	onRemove?: () => void;
}

/**
 * Preview subcomponent for LinkControlV2.
 *
 * Displays the committed link value with edit, unlink, and copy actions.
 * Supports rich previews with metadata fetching.
 */
export const Preview = forwardRef< HTMLDivElement, PreviewProps >(
	function Preview(
		{
			hasRichPreviews = false,
			hasUnlinkControl = false,
			onRemove,
			...props
		},
		ref
	) {
		const { committedValue, setIsEditing } = useLinkControlV2Context();

		const showIconLabels = useSelect(
			( select ) =>
				select( preferencesStore ).get( 'core', 'showIconLabels' ),
			[]
		);

		// Avoid fetching if rich previews are not desired.
		const showRichPreviews = hasRichPreviews
			? committedValue?.url ?? null
			: null;

		const { richData, isFetching } = useRichUrlData( showRichPreviews );

		// Rich data may be an empty object so test for that.
		const hasRichData = richData && Object.keys( richData ).length > 0;

		const displayURL =
			( committedValue?.url &&
				filterURLForDisplay(
					safeDecodeURI( committedValue.url ),
					24
				) ) ||
			'';

		// url can be undefined if the href attribute is unset
		const isEmptyURL = ! committedValue?.url?.length;

		const displayTitle =
			! isEmptyURL
				? stripHTML(
						richData?.title ||
							committedValue?.title ||
							displayURL ||
							''
				  )
				: '';

		const isUrlRedundant =
			! committedValue?.url ||
			filterTitleForDisplay( displayTitle ) === displayURL;

		let icon;

		if ( richData?.icon ) {
			icon = <img src={ richData.icon } alt="" />;
		} else if ( isEmptyURL ) {
			icon = <Icon icon={ info } size={ 32 } />;
		} else {
			icon = <Icon icon={ globe } />;
		}

		const { createNotice } = useDispatch( noticesStore );
		const copyRef = useCopyToClipboard(
			committedValue?.url ?? '',
			() => {
				createNotice( 'info', __( 'Link copied to clipboard.' ), {
					isDismissible: true,
					type: 'snackbar',
				} );
			}
		);

		const handleEditClick = () => {
			setIsEditing( true );
		};

		const handleRemove = () => {
			onRemove?.();
			setIsEditing( true );
		};

		return (
			<div
				ref={ ref }
				role="group"
				aria-label={ __( 'Manage link' ) }
				className={ clsx(
					'block-editor-link-control__search-item',
					'block-editor-link-control-v2__preview',
					{
						'is-current': true,
						'is-rich': hasRichData,
						'is-fetching': !! isFetching,
						'is-preview': true,
						'is-error': isEmptyURL,
						'is-url-title': displayTitle === displayURL,
					}
				) }
				{ ...props }
			>
				<div className="block-editor-link-control__search-item-top">
					<span
						className="block-editor-link-control__search-item-header"
						role="figure"
						aria-label={
							/* translators: Accessibility text for the link preview when editing a link. */
							__( 'Link information' )
						}
					>
						<span
							className={ clsx(
								'block-editor-link-control__search-item-icon',
								{
									'is-image': !! richData?.icon,
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
										href={ committedValue.url || '' }
									>
										<Truncate numberOfLines={ 1 }>
											{ displayTitle }
										</Truncate>
									</ExternalLink>
									{ ! isUrlRedundant && (
										<span className="block-editor-link-control__search-item-info">
											<Truncate numberOfLines={ 1 }>
												{ displayURL }
											</Truncate>
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
						icon={ pencil }
						label={ __( 'Edit link' ) }
						onClick={ handleEditClick }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
					{ hasUnlinkControl && (
						<Button
							icon={ linkOff }
							label={ __( 'Remove link' ) }
							onClick={ handleRemove }
							size="compact"
							showTooltip={ ! showIconLabels }
						/>
					) }
					<Button
						icon={ copySmall }
						label={ __( 'Copy link' ) }
						ref={ copyRef }
						accessibleWhenDisabled
						disabled={ isEmptyURL }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
					{ committedValue && (
						<ViewerSlot fillProps={ committedValue } />
					) }
				</div>
			</div>
		);
	}
);

Preview.displayName = 'LinkControlV2.Preview';

