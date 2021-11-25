/**
 * Internal dependencies
 */
import {
	createUpgradedEmbedBlock,
	getClassNames,
	fallback,
	getAttributesFromPreview,
	getEmbedInfoByProvider,
} from './util';
import EmbedControls from './embed-controls';
import { embedContentIcon } from './icons';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';
import EmbedLinkSettings from './embed-link-settings';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { View } from '@wordpress/primitives';

// The inline preview feature will be released progressible, for this reason
// the embed will only be considered previewable for the following providers list.
const PREVIEWABLE_PROVIDERS = [ 'youtube', 'twitter', 'instagram', 'vimeo' ];
// Some providers are rendering the inline preview as a WordPress embed and
// are not supported yet, so we need to disallow them with a fixed providers list.
const NOT_PREVIEWABLE_WP_EMBED_PROVIDERS = [ 'pinterest' ];

const WP_EMBED_TYPE = 'wp-embed';

const EmbedEdit = ( props ) => {
	const {
		attributes: { align, providerNameSlug, previewable, responsive, url },
		attributes,
		isSelected,
		onReplace,
		setAttributes,
		insertBlocksAfter,
		onFocus,
		clientId,
	} = props;

	const defaultEmbedInfo = {
		title: _x( 'Embed', 'block title' ),
		icon: embedContentIcon,
	};
	const embedInfoByProvider = getEmbedInfoByProvider( providerNameSlug );
	const { icon, title } = embedInfoByProvider || defaultEmbedInfo;

	const { wasBlockJustInserted } = useSelect(
		( select ) => ( {
			wasBlockJustInserted: select(
				blockEditorStore
			).wasBlockJustInserted( clientId, 'inserter_menu' ),
		} ),
		[ clientId ]
	);
	const [ isEditingURL, setIsEditingURL ] = useState(
		isSelected && wasBlockJustInserted && ! url
	);
	const [ showEmbedBottomSheet, setShowEmbedBottomSheet ] = useState(
		isEditingURL
	);
	const { invalidateResolution } = useDispatch( coreStore );

	const {
		preview,
		fetching,
		themeSupportsResponsive,
		cannotEmbed,
	} = useSelect(
		( select ) => {
			const {
				getEmbedPreview,
				hasFinishedResolution,
				isPreviewEmbedFallback,
				getThemeSupports,
			} = select( coreStore );
			if ( ! url ) {
				return { fetching: false, cannotEmbed: false };
			}

			const embedPreview = getEmbedPreview( url );
			const hasResolvedEmbedPreview = hasFinishedResolution(
				'getEmbedPreview',
				[ url ]
			);
			const previewIsFallback = isPreviewEmbedFallback( url );

			// The external oEmbed provider does not exist. We got no type info and no html.
			const badEmbedProvider =
				embedPreview?.html === false &&
				embedPreview?.type === undefined;
			// Some WordPress URLs that can't be embedded will cause the API to return
			// a valid JSON response with no HTML and `code` set to 404, rather
			// than generating a fallback response as other embeds do.
			const wordpressCantEmbed = embedPreview?.code === '404';
			const validPreview =
				!! embedPreview && ! badEmbedProvider && ! wordpressCantEmbed;

			return {
				preview: validPreview ? embedPreview : undefined,
				fetching: ! hasResolvedEmbedPreview,
				themeSupportsResponsive: getThemeSupports()[
					'responsive-embeds'
				],
				cannotEmbed: ! validPreview || previewIsFallback,
			};
		},
		[ url ]
	);

	/**
	 * Returns the attributes derived from the preview, merged with the current attributes.
	 *
	 * @param {boolean} ignorePreviousClassName Determines if the previous className attribute should be ignored when merging.
	 * @return {Object} Merged attributes.
	 */
	const getMergedAttributes = ( ignorePreviousClassName = false ) => {
		const { allowResponsive, className } = attributes;
		return {
			...attributes,
			...getAttributesFromPreview(
				preview,
				title,
				ignorePreviousClassName ? undefined : className,
				responsive,
				allowResponsive
			),
		};
	};

	const toggleResponsive = () => {
		const { allowResponsive, className } = attributes;
		const { html } = preview;
		const newAllowResponsive = ! allowResponsive;

		setAttributes( {
			allowResponsive: newAllowResponsive,
			className: getClassNames(
				html,
				className,
				responsive && newAllowResponsive
			),
		} );
	};

	useEffect( () => {
		if ( ! preview?.html || ! cannotEmbed || fetching ) {
			return;
		}
		// At this stage, we're not fetching the preview and know it can't be embedded,
		// so try removing any trailing slash, and resubmit.
		const newURL = url.replace( /\/$/, '' );
		setIsEditingURL( false );
		setAttributes( { url: newURL } );
	}, [ preview?.html, url ] );

	// Handle incoming preview.
	useEffect( () => {
		if ( preview && ! isEditingURL ) {
			// When obtaining an incoming preview, we set the attributes derived from
			// the preview data. In this case when getting the merged attributes,
			// we ignore the previous classname because it might not match the expected
			// classes by the new preview.
			setAttributes( getMergedAttributes( true ) );

			if ( onReplace ) {
				const upgradedBlock = createUpgradedEmbedBlock(
					props,
					getMergedAttributes()
				);

				if ( upgradedBlock ) {
					onReplace( upgradedBlock );
				}
			}
		}
	}, [ preview, isEditingURL ] );

	useEffect( () => setShowEmbedBottomSheet( isEditingURL ), [
		isEditingURL,
	] );

	const onEditURL = useCallback( ( value ) => {
		// The order of the following calls is important, we need to update the URL attribute before changing `isEditingURL`,
		// otherwise the side-effect that potentially replaces the block when updating the local state won't use the new URL
		// for creating the new block.
		setAttributes( { url: value } );
		setIsEditingURL( false );
	}, [] );

	const blockProps = useBlockProps();

	if ( fetching ) {
		return (
			<View { ...blockProps }>
				<EmbedLoading />
			</View>
		);
	}

	const showEmbedPlaceholder = ! preview || cannotEmbed;

	// Even though we set attributes that get derived from the preview,
	// we don't access them directly because for the initial render,
	// the `setAttributes` call will not have taken effect. If we're
	// rendering responsive content, setting the responsive classes
	// after the preview has been rendered can result in unwanted
	// clipping or scrollbars. The `getAttributesFromPreview` function
	// that `getMergedAttributes` uses is memoized so that we're not
	// calculating them on every render.
	const {
		type,
		allowResponsive,
		className: classFromPreview,
	} = getMergedAttributes();
	const className = classnames( classFromPreview, props.className );

	const isProviderPreviewable =
		PREVIEWABLE_PROVIDERS.includes( providerNameSlug ) ||
		// For WordPress embeds, we enable the inline preview for all its providers
		// except the ones that are not supported yet.
		( WP_EMBED_TYPE === type &&
			! NOT_PREVIEWABLE_WP_EMBED_PROVIDERS.includes( providerNameSlug ) );

	const linkLabel = WP_EMBED_TYPE === type ? 'WordPress' : title;

	return (
		<>
			{ showEmbedPlaceholder ? (
				<>
					<View { ...blockProps }>
						<EmbedPlaceholder
							icon={ icon }
							isSelected={ isSelected }
							label={ title }
							onPress={ ( event ) => {
								onFocus( event );
								setIsEditingURL( true );
							} }
							cannotEmbed={ cannotEmbed }
							fallback={ () => fallback( url, onReplace ) }
							tryAgain={ () => {
								invalidateResolution( 'getEmbedPreview', [
									url,
								] );
							} }
							openEmbedLinkSettings={ () =>
								setShowEmbedBottomSheet( true )
							}
						/>
					</View>
				</>
			) : (
				<>
					<EmbedControls
						themeSupportsResponsive={ themeSupportsResponsive }
						blockSupportsResponsive={ responsive }
						allowResponsive={ allowResponsive }
						toggleResponsive={ toggleResponsive }
						url={ url }
						linkLabel={ linkLabel }
						onEditURL={ onEditURL }
					/>
					<View { ...blockProps }>
						<EmbedPreview
							align={ align }
							className={ className }
							clientId={ clientId }
							icon={ icon }
							insertBlocksAfter={ insertBlocksAfter }
							isSelected={ isSelected }
							label={ title }
							onFocus={ onFocus }
							preview={ preview }
							isProviderPreviewable={ isProviderPreviewable }
							previewable={ previewable }
							type={ type }
							url={ url }
							isDefaultEmbedInfo={ ! embedInfoByProvider }
						/>
					</View>
				</>
			) }
			<EmbedLinkSettings
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus
				value={ url }
				label={ linkLabel }
				isVisible={ showEmbedBottomSheet }
				onClose={ () => setShowEmbedBottomSheet( false ) }
				onSubmit={ onEditURL }
				withBottomSheet
			/>
		</>
	);
};

export default EmbedEdit;
