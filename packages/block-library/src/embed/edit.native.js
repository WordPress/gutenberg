/**
 * Internal dependencies
 */
import {
	createUpgradedEmbedBlock,
	getAttributesFromPreview,
	getEmbedInfoByProvider,
} from './util';
import EmbedControls from './embed-controls';
import { embedContentIcon } from './icons';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';
import EmbedBottomSheet from './embed-bottom-sheet';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { View } from '@wordpress/primitives';

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
		clientId,
	} = props;

	const defaultEmbedInfo = {
		title: _x( 'Embed', 'block title' ),
		icon: embedContentIcon,
	};
	const { icon, title } =
		getEmbedInfoByProvider( providerNameSlug ) || defaultEmbedInfo;

	const [ url, setURL ] = useState( attributesUrl );

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

	const { preview, fetching, cannotEmbed } = useSelect(
		( select ) => {
			const {
				getEmbedPreview,
				isPreviewEmbedFallback,
				isRequestingEmbedPreview,
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
			// a valid JSON response with no HTML and `code` set to 404, rather
			// than generating a fallback response as other embeds do.
			const wordpressCantEmbed = embedPreview?.code === '404';
			const validPreview =
				!! embedPreview && ! badEmbedProvider && ! wordpressCantEmbed;
			return {
				preview: validPreview ? embedPreview : undefined,
				fetching: isRequestingEmbedPreview( attributesUrl ),
				cannotEmbed: ! validPreview || previewIsFallback,
			};
		},
		[ attributesUrl ]
	);

	/**
	 * @return {Object} Attributes derived from the preview, merged with the current attributes.
	 */
	const getMergedAttributes = () => {
		const { allowResponsive, className } = attributes;
		return {
			...attributes,
			...getAttributesFromPreview(
				preview,
				title,
				className,
				responsive,
				allowResponsive
			),
		};
	};

	useEffect( () => {
		if ( ! preview?.html || ! cannotEmbed || fetching ) {
			return;
		}
		// At this stage, we're not fetching the preview and know it can't be embedded,
		// so try removing any trailing slash, and resubmit.
		const newURL = attributesUrl.replace( /\/$/, '' );
		setURL( newURL );
		setIsEditingURL( false );
		setAttributes( { url: newURL } );
	}, [ preview?.html, attributesUrl ] );

	// Handle incoming preview
	useEffect( () => {
		if ( preview && ! isEditingURL ) {
			// Even though we set attributes that get derived from the preview,
			// we don't access them directly because for the initial render,
			// the `setAttributes` call will not have taken effect. If we're
			// rendering responsive content, setting the responsive classes
			// after the preview has been rendered can result in unwanted
			// clipping or scrollbars. The `getAttributesFromPreview` function
			// that `getMergedAttributes` uses is memoized so that we're not
			// calculating them on every render.
			setAttributes( getMergedAttributes() );
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

	const blockProps = useBlockProps();

	if ( fetching ) {
		return (
			<View { ...blockProps }>
				<EmbedLoading />
			</View>
		);
	}

	const showEmbedPlaceholder = ! preview || cannotEmbed;

	return (
		<>
			{ showEmbedPlaceholder ? (
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
					/>
				</View>
			) : (
				<>
					<EmbedControls
						showEditButton={ preview && ! cannotEmbed }
						switchBackToURLInput={ () => setIsEditingURL( true ) }
					/>
					<View { ...blockProps }>
						<EmbedPreview
							clientId={ clientId }
							icon={ icon }
							insertBlocksAfter={ insertBlocksAfter }
							isSelected={ isSelected }
							label={ title }
							preview={ preview }
							previewable={ previewable }
							url={ url }
						/>
					</View>
				</>
			) }
			<EmbedBottomSheet
				value={ url }
				isVisible={ isEditingURL }
				onClose={ () => setIsEditingURL( false ) }
				onSubmit={ ( value ) => {
					// On native, the URL change is only notified when submitting,
					// and not via 'onChange', so we have to explicitly set the URL.
					setURL( value );

					setIsEditingURL( false );
					setAttributes( { url: value } );
				} }
			/>
		</>
	);
};

export default EmbedEdit;
