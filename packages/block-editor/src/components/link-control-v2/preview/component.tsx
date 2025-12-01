/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import type { ComponentType, ReactNode } from 'react';
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
 * Reads display data directly from the committedValue object.
 */
export const Preview = forwardRef< HTMLDivElement, PreviewProps >(
	function Preview(
		{
			hasUnlinkControl = false,
			onRemove,
			...props
		},
		ref
	) {
		const {
			committedValue,
			setIsEditing,
		} = useLinkControlV2Context();

		const showIconLabels = useSelect(
			( select ) =>
				select( preferencesStore ).get( 'core', 'showIconLabels' ),
			[]
		);

		const displayURL =
			( committedValue?.url &&
				filterURLForDisplay(
					safeDecodeURI( committedValue.url ),
					24
				) ) ||
			'';

		// url can be undefined if the href attribute is unset
		const isEmptyURL = ! committedValue?.url?.length;

		// Display priority:
		// 1. Link label (custom text for the link)
		// 2. Title from value (if provided)
		// 3. URL (fallback)
		const displayTitle =
			! isEmptyURL
				? stripHTML(
						committedValue?.label ||
							committedValue?.title ||
							displayURL ||
							''
				  )
				: '';

		const isUrlRedundant =
			! committedValue?.url ||
			filterTitleForDisplay( displayTitle ) === displayURL;

		let icon;

		// Handle icon from value - can be Component, SVG, or URL
		if ( committedValue?.icon ) {
			const iconValue = committedValue.icon;

			// If it's a React component (function)
			if ( typeof iconValue === 'function' ) {
				const IconComponent = iconValue as ComponentType< any >;
				icon = <IconComponent />;
			}
			// If it's already a ReactNode (JSX element)
			else if (
				typeof iconValue === 'object' &&
				iconValue !== null &&
				'$$typeof' in iconValue
			) {
				icon = iconValue as ReactNode;
			}
			// If it's a string
			else if ( typeof iconValue === 'string' ) {
				// Check if it's a URL (starts with http:// or https://)
				if (
					iconValue.startsWith( 'http://' ) ||
					iconValue.startsWith( 'https://' )
				) {
					icon = <img src={ iconValue } alt="" />;
				}
				// Otherwise assume it's SVG markup
				else {
					icon = (
						<span
							dangerouslySetInnerHTML={ { __html: iconValue } }
							aria-hidden="true"
						/>
					);
				}
			}
		} else if ( committedValue?.image ) {
			icon = <img src={ committedValue.image } alt="" />;
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
						'is-rich': !!( committedValue?.icon || committedValue?.image ),
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
									'is-image': !!( committedValue?.icon || committedValue?.image ),
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

