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
	__experimentalHStack as HStack,
	Flex,
	privateApis as componentsPrivateApis,
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
import { unlock } from '../../lock-unlock';
import { ViewerSlot } from './viewer-slot';

const { Badge } = unlock( componentsPrivateApis );

import useRichUrlData from './use-rich-url-data';

export default function LinkPreview( {
	value,
	onEditClick,
	hasRichPreviews = false,
	hasUnlinkControl = false,
	onRemove,
} ) {
	const showIconLabels = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', 'showIconLabels' ),
		[]
	);

	// Avoid fetching if rich previews are not desired.
	const showRichPreviews = hasRichPreviews ? value?.url : null;

	const { richData, isFetching } = useRichUrlData( showRichPreviews );

	// Rich data may be an empty object so test for that.
	const hasRichData = richData && Object.keys( richData ).length;

	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 24 ) ) ||
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

	const { createNotice } = useDispatch( noticesStore );
	const ref = useCopyToClipboard( value.url, () => {
		createNotice( 'info', __( 'Link copied to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	return (
		<Flex
			role="group"
			aria-label={ __( 'Manage link' ) }
			className={ clsx( 'block-editor-link-control__preview', {
				'is-current': true,
				'is-rich': hasRichData,
				'is-fetching': !! isFetching,
				'is-preview': true,
				'is-error': isEmptyURL,
				'is-url-title': displayTitle === displayURL,
			} ) }
		>
			<Flex gap={ 0 } align="flex-start">
				<Flex
					className="block-editor-link-control__link-information"
					role="figure"
					aria-label={
						/* translators: Accessibility text for the link preview when editing a link. */
						__( 'Link information' )
					}
					justify="start"
					align="flex-start"
				>
					{ value?.image ? (
						<Flex
							className="block-editor-link-control__preview-image"
							justify="center"
						>
							<img src={ value?.image } alt="" />
						</Flex>
					) : (
						<Flex
							className={ clsx(
								'block-editor-link-control__preview-icon',
								{
									'is-image': richData?.icon,
								}
							) }
							justify="center"
						>
							{ icon }
						</Flex>
					) }
					<Flex
						className="block-editor-link-control__preview-details"
						direction="column"
						gap={ 2 }
					>
						{ ! isEmptyURL ? (
							<>
								<ExternalLink
									className="block-editor-link-control__preview-title"
									href={ value.url }
								>
									<Truncate numberOfLines={ 1 }>
										{ displayTitle }
									</Truncate>
								</ExternalLink>
								<span className="block-editor-link-control__preview-info">
									<Truncate numberOfLines={ 1 }>
										{ displayURL }
									</Truncate>
								</span>
								{ value?.badges?.length > 0 && (
									<HStack
										className="block-editor-link-control__preview-badges"
										alignment="left"
										gap={ 1 }
									>
										{ value.badges.map(
											( badge, index ) => (
												<Badge
													key={ `${ badge.label }|${ badge.intent }|${ index }` }
													intent={ badge.intent }
												>
													{ badge.label }
												</Badge>
											)
										) }
									</HStack>
								) }
							</>
						) : (
							<span className="block-editor-link-control__preview-error-notice">
								{ __( 'Link is empty' ) }
							</span>
						) }
					</Flex>
				</Flex>
				<Button
					icon={ pencil }
					label={ __( 'Edit link' ) }
					onClick={ onEditClick }
					size="compact"
					showTooltip={ ! showIconLabels }
				/>
				{ hasUnlinkControl && (
					<Button
						icon={ linkOff }
						label={ __( 'Remove link' ) }
						onClick={ onRemove }
						size="compact"
						showTooltip={ ! showIconLabels }
					/>
				) }
				<Button
					icon={ copySmall }
					label={ __( 'Copy link' ) }
					ref={ ref }
					accessibleWhenDisabled
					disabled={ isEmptyURL }
					size="compact"
					showTooltip={ ! showIconLabels }
				/>
				<ViewerSlot fillProps={ value } />
			</Flex>
		</Flex>
	);
}
