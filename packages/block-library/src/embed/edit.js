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
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { View } from '@wordpress/primitives';
import { Caption } from '../utils/caption';

/**
 * Internal dependencies
 */
import {
	createUpgradedEmbedBlock,
	findMoreSuitableBlock,
	getClassNames,
	rewriteXToTwitter,
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
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

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

	function toggleResponsive( newAllowResponsive ) {
		const { className } = attributes;
		const { html } = preview;
		setAttributes( {
			allowResponsive: newAllowResponsive,
			className: getClassNames(
				html,
				className,
				responsive && newAllowResponsive
			),
		} );
	}

	// When the preview can't be embedded, retry without any trailing slash.
	useEffect( () => {
		if ( ! cannotEmbed || ! hasResolved || ! attributesUrl ) {
			return;
		}

		const newURL = attributesUrl.replace( /\/$/, '' );
		if ( newURL === attributesUrl ) {
			return;
		}

		setURL( newURL );
		setIsEditingURL( false );
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { url: newURL } );
	}, [
		attributesUrl,
		cannotEmbed,
		hasResolved,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Apply preview-derived attributes once the preview resolves.
	useEffect( () => {
		if ( ! preview || isEditingURL ) {
			return;
		}

		const mergedAttributes = getMergedAttributes();

		if ( onReplace ) {
			const upgradedBlock = createUpgradedEmbedBlock(
				props,
				mergedAttributes
			);

			if ( upgradedBlock ) {
				// Mutate via setAttributes; onReplace would remount the
				// block and clear the URL textbox on undo.
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( upgradedBlock.attributes );
				return;
			}
		}

		const hasChanges = Object.keys( mergedAttributes ).some(
			( key ) => mergedAttributes[ key ] !== attributes[ key ]
		);

		if ( hasChanges ) {
			// Merge into the URL-submit undo level so a single undo
			// reverts both the submit and the preview-driven attributes.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( mergedAttributes );
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

						const rewrittenURL = rewriteXToTwitter( url );
						const blockClass = removeAspectRatioClasses(
							attributes.className
						);

						setURL( rewrittenURL );
						setAttributes( {
							url: rewrittenURL,
							...findMoreSuitableBlock( rewrittenURL )
								?.attributes,
							className: blockClass,
						} );
						setIsEditingURL( false );
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
