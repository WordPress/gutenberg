/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	JustifyContentControl,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

function Breadcrumb( {
	addLeadingSeparator,
	crumbTitle,
	editableTitleField = undefined,
	isSelected,
	placeholder,
	separator,
	setAttributes,
	showSeparator,
} ) {
	let crumbAnchor;
	let separatorSpan;

	// Keep track of whether or not the title field has been edited.
	// This allows the default site title to be rendered as full "real" text.
	// Then, when it's edited, if the title is removed, it is displayed as a placeholder,
	// until the block is de-selected, where it is then treated as real text again.
	const [ isDirty, setIsDirty ] = useState();

	useEffect( () => {
		if ( ! isSelected ) {
			setIsDirty( false );
		}
	}, [ isSelected ] );

	if ( separator || isSelected ) {
		separatorSpan = (
			<span className="wp-block-breadcrumbs__separator">
				<RichText
					aria-label={ __( 'Separator character' ) }
					placeholder={ __( '/' ) }
					withoutInteractiveFormatting
					value={ separator }
					onChange={ ( html ) =>
						setAttributes( { separator: html } )
					}
				/>
			</span>
		);
	}

	if ( editableTitleField ) {
		/* eslint-disable jsx-a11y/anchor-is-valid */
		crumbAnchor = (
			<a href="#" onClick={ ( event ) => event.preventDefault() }>
				{ isSelected ? (
					<RichText
						aria-label={ __( 'Title override' ) }
						placeholder={ placeholder }
						withoutInteractiveFormatting
						value={
							isDirty
								? crumbTitle ?? placeholder
								: crumbTitle || placeholder
						}
						onChange={ ( html ) => {
							setIsDirty( true );
							setAttributes( { [ editableTitleField ]: html } );
						} }
					/>
				) : (
					crumbTitle || placeholder
				) }
			</a>
		);
		/* eslint-enable */
	} else if ( crumbTitle ) {
		/* eslint-disable jsx-a11y/anchor-is-valid */
		crumbAnchor = (
			<a href="#" onClick={ ( event ) => event.preventDefault() }>
				{ crumbTitle }
			</a>
		);
		/* eslint-enable */
	}

	return (
		<li className="wp-block-breadcrumbs__item">
			{ addLeadingSeparator ? separatorSpan : null }
			{ crumbAnchor }
			{ showSeparator ? separatorSpan : null }
		</li>
	);
}

export default function BreadcrumbsEdit( {
	attributes,
	isSelected,
	setAttributes,
	context: { postType, postId },
} ) {
	const {
		contentJustification,
		separator,
		showCurrentPageTitle,
		showLeadingSeparator,
		showSiteTitle,
		siteTitleOverride,
	} = attributes;

	const { categories, parents, post, siteTitle } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } =
				select( coreStore );

			const siteData = getEntityRecord( 'root', '__unstableBase' );
			const currentPost = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);

			const parentCategories = [];
			const parentEntities = [];
			let categoryId = currentPost?.categories?.[ 0 ];
			let currentParentId = currentPost?.parent;

			while ( currentParentId ) {
				const nextParent = getEntityRecord(
					'postType',
					postType,
					currentParentId
				);

				currentParentId = null;

				if ( nextParent ) {
					parentEntities.push( nextParent );
					currentParentId = nextParent?.parent || null;
				}
			}

			while ( categoryId ) {
				const nextCategory = getEntityRecord(
					'taxonomy',
					'category',
					categoryId
				);

				categoryId = null;

				if ( nextCategory ) {
					parentCategories.push( nextCategory );
					categoryId = nextCategory?.parent || null;
				}
			}

			return {
				categories: parentCategories,
				post: currentPost,
				parents: parentEntities.reverse(),
				siteTitle: decodeEntities( siteData?.name ),
			};
		},
		[ postId, postType ]
	);

	// Construct breadcrumbs.
	const breadcrumbs = useMemo( () => {
		// Set breadcrumb names to real hierarchical post titles if available, and
		// fall back to category names, or placeholder content if neither exists.

		const crumbs = [];
		let breadcrumbTitles;

		if ( parents?.length ) {
			breadcrumbTitles = parents.map(
				( parent ) => parent?.title?.rendered || ' '
			);
		} else if ( categories?.length ) {
			breadcrumbTitles = categories.map(
				( category ) => category?.name || ' '
			);
		} else {
			breadcrumbTitles = [ __( 'Top-level page' ), __( 'Child page' ) ];
		}

		// Prepend the site title or site title override if specified.
		if ( showSiteTitle && siteTitle ) {
			crumbs.push(
				<Breadcrumb
					addLeadingSeparator={ showLeadingSeparator }
					crumbTitle={ siteTitleOverride }
					editableTitleField={ 'siteTitleOverride' }
					isSelected={ isSelected }
					placeholder={ siteTitle }
					separator={ separator }
					setAttributes={ setAttributes }
					showSeparator={ !! breadcrumbTitles.length }
					key="site-title"
				/>
			);
		}

		// Append current page title if set.
		if ( showCurrentPageTitle ) {
			breadcrumbTitles.push( post?.title || __( 'Current page' ) );
		}

		breadcrumbTitles.forEach( ( item, index ) => {
			crumbs.push(
				<Breadcrumb
					addLeadingSeparator={
						index === 0 && showLeadingSeparator && ! showSiteTitle
					}
					crumbTitle={ item }
					isSelected={ isSelected }
					separator={ separator }
					setAttributes={ setAttributes }
					showSeparator={ index < breadcrumbTitles.length - 1 }
					key={ index }
				/>
			);
		} );

		return crumbs;
	}, [
		categories,
		isSelected,
		parents,
		post?.title,
		separator,
		setAttributes,
		showCurrentPageTitle,
		showLeadingSeparator,
		showSiteTitle,
		siteTitle,
		siteTitleOverride,
	] );

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `is-content-justification-${ contentJustification }` ]:
				contentJustification,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<JustifyContentControl
					allowedControls={ [ 'left', 'center', 'right' ] }
					value={ contentJustification }
					onChange={ ( value ) =>
						setAttributes( { contentJustification: value } )
					}
					popoverProps={ {
						position: 'bottom right',
						isAlternate: true,
					} }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Display' ) }>
					<ToggleControl
						label={ __( 'Show leading separator' ) }
						checked={ showLeadingSeparator }
						onChange={ () =>
							setAttributes( {
								showLeadingSeparator: ! showLeadingSeparator,
							} )
						}
					/>
					<ToggleControl
						label={ __( 'Show current page title' ) }
						checked={ showCurrentPageTitle }
						onChange={ () =>
							setAttributes( {
								showCurrentPageTitle: ! showCurrentPageTitle,
							} )
						}
					/>
					<ToggleControl
						label={ __( 'Show site title' ) }
						checked={ showSiteTitle }
						onChange={ () =>
							setAttributes( {
								showSiteTitle: ! showSiteTitle,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<nav { ...blockProps }>
				<ol>{ breadcrumbs }</ol>
			</nav>
		</>
	);
}
