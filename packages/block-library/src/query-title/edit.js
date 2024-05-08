/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	Warning,
	HeadingLevelDropdown,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

const SUPPORTED_TYPES = [ 'archive', 'search' ];

export default function QueryTitleEdit( {
	attributes: {
		type,
		level,
		textAlign,
		showPrefix,
		showSearchTerm,
		searchResultsTerm,
		searchResultsTermSuffix,
	},
	setAttributes,
} ) {
	const { archiveTypeTitle, archiveNameLabel } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const {
			__experimentalArchiveTitleNameLabel,
			__experimentalArchiveTitleTypeLabel,
		} = getSettings();
		return {
			archiveTypeTitle: __experimentalArchiveTitleTypeLabel,
			archiveNameLabel: __experimentalArchiveTitleNameLabel,
		};
	} );

	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if ( ! SUPPORTED_TYPES.includes( type ) ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Provided type is not supported.' ) }</Warning>
			</div>
		);
	}

	let titleElement;
	if ( type === 'archive' ) {
		let title;
		if ( archiveTypeTitle ) {
			if ( showPrefix ) {
				if ( archiveNameLabel ) {
					title = sprintf(
						/* translators: 1: Archive type title e.g: "Category", 2: Label of the archive e.g: "Shoes" */
						__( '%1$s: %2$s' ),
						archiveTypeTitle,
						archiveNameLabel
					);
				} else {
					title = sprintf(
						/* translators: %s: Archive type title e.g: "Category", "Tag"... */
						__( '%s: Name' ),
						archiveTypeTitle
					);
				}
			} else if ( archiveNameLabel ) {
				title = archiveNameLabel;
			} else {
				title = sprintf(
					/* translators: %s: Archive type title e.g: "Category", "Tag"... */
					__( '%s name' ),
					archiveTypeTitle
				);
			}
		} else {
			title = showPrefix
				? __( 'Archive type: Name' )
				: __( 'Archive title' );
		}

		titleElement = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show archive type in title' ) }
							onChange={ () =>
								setAttributes( { showPrefix: ! showPrefix } )
							}
							checked={ showPrefix }
						/>
					</PanelBody>
				</InspectorControls>
				<TagName { ...blockProps }>{ title }</TagName>
			</>
		);
	}

	if ( type === 'search' ) {
		titleElement = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show search term in title' ) }
							onChange={ () =>
								setAttributes( {
									showSearchTerm: ! showSearchTerm,
								} )
							}
							checked={ showSearchTerm }
						/>
					</PanelBody>
				</InspectorControls>

				{ showSearchTerm ? (
					<div { ...blockProps }>
						<RichText
							tagName={ `h${ level }` }
							value={ searchResultsTerm }
							onChange={ ( content ) =>
								setAttributes( { searchResultsTerm: content } )
							}
							placeholder={ __( 'Search Results for:' ) }
						/>
						<TagName>{ __( 'Search Term' ) }</TagName>
						<RichText
							tagName={ `h${ level }` }
							value={ searchResultsTermSuffix }
							onChange={ ( content ) =>
								setAttributes( {
									searchResultsTermSuffix: content,
								} )
							}
							placeholder={ __( 'Suffix' ) }
						/>
					</div>
				) : (
					<RichText
						{ ...blockProps }
						tagName={ `h${ level }` }
						value={ searchResultsTerm }
						allowedFormats={ [] }
						onChange={ ( content ) =>
							setAttributes( { searchResultsTerm: content } )
						}
						placeholder={ __( 'Search Results' ) }
					/>
				) }
			</>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			{ titleElement }
		</>
	);
}
