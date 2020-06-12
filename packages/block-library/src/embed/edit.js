/**
 * Internal dependencies
 */
import {
	createUpgradedEmbedBlock,
	getClassNames,
	fallback,
	getAttributesFromPreview,
} from './util';
import EmbedControls from './embed-controls';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

function getResponsiveHelp( checked ) {
	return checked
		? __(
				'This embed will preserve its aspect ratio when the browser is resized.'
		  )
		: __(
				'This embed may not preserve its aspect ratio when the browser is resized.'
		  );
}

export function getEmbedEditComponent(
	title,
	icon,
	responsive = true,
	previewable = true
) {
	return function EmbedEditComponent( props ) {
		const {
			attributes,
			cannotEmbed,
			fetching,
			isSelected,
			onReplace,
			preview,
			setAttributes,
			themeSupportsResponsive,
			tryAgain,
			insertBlocksAfter,
		} = props;

		const [ url, setURL ] = useState( attributes.url );
		const [ isEditingURL, setIsEditingURL ] = useState( false );

		/**
		 * @return {Object} Attributes derived from the preview, merged with the current attributes.
		 */
		const getMergedAttributes = () => {
			const { className, allowResponsive } = attributes;
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

		const handleIncomingPreview = () => {
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
			// If we can embed the url, bail early.
			if ( ! cannotEmbed ) {
				return;
			}

			// At this stage, we either have a new preview or a new URL, but we can't embed it.
			// If we are already fetching the preview, bail early.
			if ( fetching ) {
				return;
			}

			// At this stage, we're not fetching the preview, so we know it can't be embedded, so try
			// removing any trailing slash, and resubmit.
			const newURL = attributes.url.replace( /\/$/, '' );
			setURL( newURL );
			setIsEditingURL( false );
			setAttributes( { url: newURL } );
		}, [ attributes.allowResponsive, attributes.className, cannotEmbed, fetching, preview.html ] );

		useEffect( () => {
			if ( preview && ! isEditingURL ) {
				handleIncomingPreview();
			}
		}, [ preview, isEditingURL ] );

		if ( fetching ) {
			return <EmbedLoading />;
		}

		// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
		const label = sprintf( __( '%s URL' ), title );

		// No preview, or we can't embed the current URL, or we've clicked the edit button.
		if ( ! preview || cannotEmbed || isEditingURL ) {
			return (
				<EmbedPlaceholder
					icon={ icon }
					label={ label }
					onSubmit={ ( event ) => {
						if ( event ) {
							event.preventDefault();
						}

						setIsEditingURL( false );
						setAttributes( { url } );
					} }
					value={ url }
					cannotEmbed={ cannotEmbed }
					onChange={ ( event ) => setURL( event.target.value ) }
					fallback={ () => fallback( url, onReplace ) }
					tryAgain={ tryAgain }
				/>
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
		const previewAttributes = getMergedAttributes(
			props,
			title,
			responsive
		);
		const { caption, type, allowResponsive } = previewAttributes;
		const className = classnames(
			previewAttributes.className,
			props.className
		);

		return (
			<>
				<EmbedControls
					showEditButton={ preview && ! cannotEmbed }
					themeSupportsResponsive={ themeSupportsResponsive }
					blockSupportsResponsive={ responsive }
					allowResponsive={ allowResponsive }
					getResponsiveHelp={ getResponsiveHelp }
					toggleResponsive={ toggleResponsive }
					switchBackToURLInput={ () => setIsEditingURL( true ) }
				/>
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
				/>
			</>
		);
	};
}
