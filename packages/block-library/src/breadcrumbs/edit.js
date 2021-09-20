/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	RangeControl,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { buildBreadcrumb } from './utils';

export default function BreadcrumbsEdit( {
	attributes,
	setAttributes,
	context: { postType, postId },
} ) {
	const {
		nestingLevel,
		separator,
		showCurrentPageTitle,
		showLeadingSeparator,
		showSiteTitle,
		siteTitleOverride,
		textAlign,
	} = attributes;

	const { categories, parents, post, siteTitle } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } = select(
				coreStore
			);

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
			if ( siteTitleOverride ) {
				breadcrumbTitles.unshift( siteTitleOverride );
			} else {
				breadcrumbTitles.unshift( siteTitle );
			}
		}

		// Limit titles by nesting level.
		if ( nestingLevel > 0 ) {
			breadcrumbTitles = breadcrumbTitles.slice( -nestingLevel );
		}

		// Append current page title if set.
		if ( showCurrentPageTitle ) {
			breadcrumbTitles.push( post?.title || __( 'Current page' ) );
		}

		const crumbs = [];
		crumbs.push(
			...breadcrumbTitles.map( ( item, index ) =>
				buildBreadcrumb( {
					crumbTitle: item,
					separator,
					showSeparator: index < breadcrumbTitles.length - 1,
					addLeadingSeparator: index === 0 && showLeadingSeparator,
					key: index,
				} )
			)
		);
		return crumbs;
	}, [
		categories,
		nestingLevel,
		parents,
		showCurrentPageTitle,
		showLeadingSeparator,
		showSiteTitle,
		siteTitle,
		siteTitleOverride,
	] );

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Breadcrumbs' ) }>
					<RangeControl
						label={ __( 'Nesting level' ) }
						help={ __(
							'Control how many levels of nesting to display. Set to 0 to show all nesting levels.'
						) }
						value={ nestingLevel }
						onChange={ ( value ) =>
							setAttributes( { nestingLevel: value } )
						}
						min={ 0 }
						max={ Math.max( 10, nestingLevel ) }
					/>
					<TextControl
						label={ __( 'Separator character' ) }
						help={ __(
							'Enter a character to display between items.'
						) }
						value={ separator || '' }
						placeholder={ __( 'e.g. / - *' ) }
						onChange={ ( nextValue ) =>
							setAttributes( {
								separator: nextValue,
							} )
						}
						autoCapitalize="none"
						autoComplete="off"
					/>
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
					{ showSiteTitle && (
						<TextControl
							label={ __( 'Site title override' ) }
							help={ __(
								'Enter a label to override the site title'
							) }
							value={ siteTitleOverride || '' }
							placeholder={ __( 'e.g. Home' ) }
							onChange={ ( nextValue ) =>
								setAttributes( {
									siteTitleOverride: nextValue,
								} )
							}
							autoCapitalize="none"
							autoComplete="off"
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<nav { ...blockProps }>
				<ol>{ breadcrumbs }</ol>
			</nav>
		</>
	);
}
