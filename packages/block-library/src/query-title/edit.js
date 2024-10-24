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
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { ToggleControl, PanelBody, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useArchiveLabel } from './use-archive-label';

const SUPPORTED_TYPES = [ 'archive', 'search', 'blog' ];

export default function QueryTitleEdit( {
	attributes: {
		type,
		level,
		levelOptions,
		textAlign,
		showPrefix,
		showSearchTerm,
		blogTitle,
	},
	setAttributes,
} ) {
	const { archiveTypeLabel, archiveNameLabel } = useArchiveLabel();
	const currentTemplate = useSelect( ( select ) => {
		return select( coreStore )?.getEditedPostType();
	} );

	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if (
		! SUPPORTED_TYPES.includes( type ) &&
		! [ 'index', 'home' ].includes( currentTemplate )
	) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Provided type is not supported.' ) }</Warning>
			</div>
		);
	}

	let titleElement;
	if ( type === 'archive' ) {
		let title;
		if ( archiveTypeLabel ) {
			if ( showPrefix ) {
				if ( archiveNameLabel ) {
					title = sprintf(
						/* translators: 1: Archive type title e.g: "Category", 2: Label of the archive e.g: "Shoes" */
						__( '%1$s: %2$s' ),
						archiveTypeLabel,
						archiveNameLabel
					);
				} else {
					title = sprintf(
						/* translators: %s: Archive type title e.g: "Category", "Tag"... */
						__( '%s: Name' ),
						archiveTypeLabel
					);
				}
			} else if ( archiveNameLabel ) {
				title = archiveNameLabel;
			} else {
				title = sprintf(
					/* translators: %s: Archive type title e.g: "Category", "Tag"... */
					__( '%s name' ),
					archiveTypeLabel
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
	} else if ( type === 'search' ) {
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

				<TagName { ...blockProps }>
					{ showSearchTerm
						? __( 'Search results for: “search term”' )
						: __( 'Search results' ) }
				</TagName>
			</>
		);
	} else if (
		[ 'index', 'home' ].includes( currentTemplate ) ||
		type === 'blog'
	) {
		titleElement = (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Blog Title' ) }
							value={ blogTitle || __( 'Blog' ) }
							onChange={ ( value ) =>
								setAttributes( { blogTitle: value } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<TagName { ...blockProps }>
					{ blogTitle || __( 'Blog' ) }
				</TagName>
			</>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ level }
					options={ levelOptions }
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
			{ titleElement || (
				<div { ...blockProps }>
					<Warning>
						{ __( 'Unsupported template for Query Title block.' ) }
					</Warning>
				</div>
			) }
		</>
	);
}
