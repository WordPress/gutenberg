/**
 * Internal dependencies
 */
import {
	createUpgradedEmbedBlock,
	getClassNames,
	removeAspectRatioClasses,
	fallback,
	getEmbedInfoByProvider,
	getMergedAttributesWithPreview,
} from './util';
import EmbedControls from './embed-controls';
import { embedContentIcon } from './icons';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';

/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { View } from '@wordpress/primitives';
import { getAuthority } from '@wordpress/url';
import { Caption } from '../utils/caption';

const EmbedEdit = ( props ) => {
	const {
		attributes: {
			providerNameSlug,
			previewable,
			responsive,
			url: attributesUrl,
		},
		attributes,
		isSelected,
		onReplace,
		setAttributes,
		insertBlocksAfter,
		onFocus,
	} = props;

	const defaultEmbedInfo = {
		title: _x( 'Embed', 'block title' ),
		icon: embedContentIcon,
	};
	const { icon, title } =
		getEmbedInfoByProvider( providerNameSlug ) || defaultEmbedInfo;

	const [ url, setURL ] = useState( attributesUrl );
	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );

	const {
		preview,
		fetching,
		themeSupportsResponsive,
		cannotEmbed,
		hasResolved,
	} = useSelect(
		( select ) => {
			const {
				getEmbedPreview,
				isPreviewEmbedFallback,
				isRequestingEmbedPreview,
				getThemeSupports,
				hasFinishedResolution,
			} = select( coreStore );
			if ( ! attributesUrl ) {
				return { fetching: false, cannotEmbed: false };
			}

			const embedPreview = getEmbedPreview( attributesUrl );
			const previewIsFallback = isPreviewEmbedFallback( attributesUrl );

			// The external oEmbed provider does not exist. We got no type info and no html.
			const badEmbedProvider =
				embedPreview?.html === false &&
				embedPreview?.type === undefined;
			// Some WordPress URLs that can't be embedded will cause the API to return
			// a valid JSON response with no HTML and `data.status` set to 404, rather
			// than generating a fallback response as other embeds do.
			const wordpressCantEmbed = embedPreview?.data?.status === 404;
			const validPreview =
				!! embedPreview && ! badEmbedProvider && ! wordpressCantEmbed;
			return {
				preview: validPreview ? embedPreview : undefined,
				fetching: isRequestingEmbedPreview( attributesUrl ),
				themeSupportsResponsive:
					getThemeSupports()[ 'responsive-embeds' ],
				cannotEmbed: ! validPreview || previewIsFallback,
				hasResolved: hasFinishedResolution( 'getEmbedPreview', [
					attributesUrl,
				] ),
			};
		},
		[ attributesUrl ]
	);

	/**
	 * Returns the attributes derived from the preview, merged with the current attributes.
	 *
	 * @return {Object} Merged attributes.
	 */
	const getMergedAttributes = () =>
		getMergedAttributesWithPreview(
			attributes,
			preview,
			title,
			responsive
		);

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
		if ( preview?.html || ! cannotEmbed || ! hasResolved ) {
			return;
		}

		// At this stage, we're not fetching the preview and know it can't be embedded,
		// so try removing any trailing slash, and resubmit.
		const newURL = attributesUrl.replace( /\/$/, '' );
		setURL( newURL );
		setIsEditingURL( false );
		setAttributes( { url: newURL } );
	}, [
		preview?.html,
		attributesUrl,
		cannotEmbed,
		hasResolved,
		setAttributes,
	] );

	// Try a different provider in case the embed url is not supported.
	useEffect( () => {
		if ( ! cannotEmbed || fetching || ! url ) {
			return;
		}

		// Until X provider is supported in WordPress, as a workaround we use Twitter provider.
		if ( getAuthority( url ) === 'x.com' ) {
			const newURL = new URL( url );
			newURL.host = 'twitter.com';
			setAttributes( { url: newURL.toString() } );
		}
	}, [ url, cannotEmbed, fetching, setAttributes ] );

	// Handle incoming preview.
	useEffect( () => {
		if ( preview && ! isEditingURL ) {
			// When obtaining an incoming preview,
			// we set the attributes derived from the preview data.
			const mergedAttributes = getMergedAttributes();
			setAttributes( mergedAttributes );

			if ( onReplace ) {
				const upgradedBlock = createUpgradedEmbedBlock(
					props,
					mergedAttributes
				);

				if ( upgradedBlock ) {
					onReplace( upgradedBlock );
				}
			}
		}
	}, [ preview, isEditingURL ] );

	const blockProps = useBlockProps();

	if ( fetching ) {
		return (
			<View { ...blockProps }>
				<EmbedLoading />
			</View>
		);
	}

	// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
	const label = sprintf( __( '%s URL' ), title );

	// No preview, or we can't embed the current URL, or we've clicked the edit button.
	const showEmbedPlaceholder = ! preview || cannotEmbed || isEditingURL;

	if ( showEmbedPlaceholder ) {
		return (
			<View { ...blockProps }>
				<EmbedPlaceholder
					icon={ icon }
					label={ label }
					onFocus={ onFocus }
					onSubmit={ ( event ) => {
						if ( event ) {
							event.preventDefault();
						}

						// If the embed URL was changed, we need to reset the aspect ratio class.
						// To do this we have to remove the existing ratio class so it can be recalculated.
						const blockClass = removeAspectRatioClasses(
							attributes.className
						);

						setIsEditingURL( false );
						setAttributes( { url, className: blockClass } );
					} }
					value={ url }
					cannotEmbed={ cannotEmbed }
					onChange={ ( value ) => setURL( value ) }
					fallback={ () => fallback( url, onReplace ) }
					tryAgain={ () => {
						invalidateResolution( 'getEmbedPreview', [ url ] );
					} }
				/>
			</View>
		);
	}

	// Even though we set attributes that get derived from the preview,
	// we don't access them directly because for the initial render,
	// the `setAttributes` call will not have taken effect. If we're
	// rendering responsive content, setting the responsive classes
	// after the preview has been rendered can result in unwanted
	// clipping or scrollbars. The `getAttributesFromPreview` function
	// that `getMergedAttributes` uses is memoized so that we're not
	// calculating them on every render.
	const {
		caption,
		type,
		allowResponsive,
		className: classFromPreview,
	} = getMergedAttributes();
	const className = clsx( classFromPreview, props.className );

	return (
		<>
			<EmbedControls
				showEditButton={ preview && ! cannotEmbed }
				themeSupportsResponsive={ themeSupportsResponsive }
				blockSupportsResponsive={ responsive }
				allowResponsive={ allowResponsive }
				toggleResponsive={ toggleResponsive }
				switchBackToURLInput={ () => setIsEditingURL( true ) }
			/>
			<figure
				{ ...blockProps }
				className={ clsx( blockProps.className, className, {
					[ `is-type-${ type }` ]: type,
					[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
					[ `wp-block-embed-${ providerNameSlug }` ]:
						providerNameSlug,
				} ) }
			>
				<EmbedPreview
					preview={ preview }
					previewable={ previewable }
					className={ className }
					url={ url }
					type={ type }
					caption={ caption }
					onCaptionChange={ ( value ) =>
						setAttributes( { caption: value } )
					}
					isSelected={ isSelected }
					icon={ icon }
					label={ label }
					insertBlocksAfter={ insertBlocksAfter }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Embed caption text' ) }
					showToolbarButton={ isSelected }
				/>
			</figure>
		</>
	);
};

export default EmbedEdit;
