/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
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
import { ViewerSlot } from './viewer-slot';

import useRichUrlData from './use-rich-url-data';

/**
 * Filters the title for display. Removes the protocol and www prefix.
 *
 * @param {string} title The title to be filtered.
 *
 * @return {string} The filtered title.
 */
function filterTitleForDisplay( title ) {
	// Derived from `filterURLForDisplay` in `@wordpress/url`.
	return title
		.replace( /^[a-z\-.\+]+[0-9]*:(\/\/)?/i, '' )
		.replace( /^www\./i, '' );
}

export default function LinkPreview( {
	value,
	onEditClick,
	hasRichPreviews = false,
	hasUnlinkControl = false,
	hasCopyControl = true,
	onRemove,
	onToggle,
	isOpen,
} ) {
	const showIconLabels = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', 'showIconLabels' ),
		[]
	);

	// Get entity type name and status from value props (for entity links)
	const getEntityDisplayInfo = () => {
		// Only process if we have an entity ID
		if ( ! value?.id || ! value?.kind || ! value?.type ) {
			return { entityTypeName: null, entityStatus: null };
		}

		const isPostType = value.kind === 'post-type';
		const isTaxonomy = value.kind === 'taxonomy';

		if ( ! isPostType && ! isTaxonomy ) {
			return { entityTypeName: null, entityStatus: null };
		}

		// Get entity type name
		let typeName = value.type;
		if ( isPostType ) {
			switch ( value.type ) {
				case 'post':
					typeName = __( 'Post' );
					break;
				case 'page':
					typeName = __( 'Page' );
					break;
				default:
					typeName = value.type;
			}
		} else {
			switch ( value.type ) {
				case 'category':
					typeName = __( 'Category' );
					break;
				case 'tag':
					typeName = __( 'Tag' );
					break;
				default:
					typeName = __( 'Term' );
			}
		}

		// Get status from value.status if provided, otherwise default
		// For taxonomies, always show "Published"
		let status = null;
		if ( isTaxonomy ) {
			status = __( 'Published' );
		} else if ( value.status ) {
			// Status can be passed in the value prop
			switch ( value.status ) {
				case 'publish':
					status = __( 'Published' );
					break;
				case 'draft':
					status = __( 'Draft' );
					break;
				case 'pending':
					status = __( 'Pending' );
					break;
				case 'private':
					status = __( 'Private' );
					break;
				case 'future':
					status = __( 'Scheduled' );
					break;
				default:
					status = value.status;
			}
		} else {
			// Default to Published if no status provided
			status = __( 'Published' );
		}

		return {
			entityTypeName: typeName,
			entityStatus: status,
		};
	};

	const { entityTypeName, entityStatus } = getEntityDisplayInfo();

	// Avoid fetching if rich previews are not desired.
	const showRichPreviews = hasRichPreviews ? value?.url : null;

	const { richData, isFetching } = useRichUrlData( showRichPreviews );

	// Rich data may be an empty object so test for that.
	const hasRichData = richData && Object.keys( richData ).length;

	// For entity links, show entity type and status instead of URL
	const displayURL =
		entityTypeName && entityStatus
			? `${ entityTypeName } - ${ entityStatus }`
			: ( value &&
					filterURLForDisplay( safeDecodeURI( value.url ), 24 ) ) ||
			  '';

	// url can be undefined if the href attribute is unset
	const isEmptyURL = ! value?.url?.length;

	const displayTitle =
		! isEmptyURL &&
		stripHTML( richData?.title || value?.title || displayURL );

	const isUrlRedundant =
		! value?.url || filterTitleForDisplay( displayTitle ) === displayURL;

	let icon;

	if ( richData?.icon ) {
		icon = <img src={ richData?.icon } alt="" />;
	} else if ( isEmptyURL ) {
		icon = <Icon icon={ info } size={ 32 } />;
	} else {
		icon = <Icon icon={ globe } />;
	}

	const { createNotice } = useDispatch( noticesStore );
	const ref = useCopyToClipboard( value.url, () => {
		createNotice( 'info', __( 'Link copied to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	const containerProps = onToggle
		? {
				role: 'button',
				'aria-label': __( 'Edit link' ),
				'aria-expanded': isOpen,
				onClick: onToggle,
				onKeyDown: ( event ) => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						onToggle();
					}
				},
				tabIndex: 0,
				className: clsx( 'block-editor-link-control__search-item', {
					'is-current': true,
					'is-rich': hasRichData,
					'is-fetching': !! isFetching,
					'is-preview': true,
					'is-error': isEmptyURL,
					'is-url-title': displayTitle === displayURL,
					'is-dropdown-toggle': true,
					'is-open': isOpen,
				} ),
		  }
		: {
				role: 'group',
				'aria-label': __( 'Manage link' ),
				className: clsx( 'block-editor-link-control__search-item', {
					'is-current': true,
					'is-rich': hasRichData,
					'is-fetching': !! isFetching,
					'is-preview': true,
					'is-error': isEmptyURL,
					'is-url-title': displayTitle === displayURL,
				} ),
		  };

	return (
		<div { ...containerProps }>
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
									href={ onToggle ? undefined : value.url }
									onClick={
										onToggle
											? ( e ) => e.preventDefault()
											: undefined
									}
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
				{ ! onToggle && (
					<Button
						icon={ pencil }
						label={ __( 'Edit link' ) }
						onClick={ onEditClick }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
				) }
				{ ! onToggle && hasUnlinkControl && (
					<Button
						icon={ linkOff }
						label={ __( 'Remove link' ) }
						onClick={ onRemove }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
				) }
				{ hasCopyControl && (
					<Button
						icon={ copySmall }
						label={ __( 'Copy link' ) }
						ref={ ref }
						accessibleWhenDisabled
						disabled={ isEmptyURL }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
				) }
				<ViewerSlot fillProps={ value } />
			</div>
		</div>
	);
}
