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
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */

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
		textAlign,
	} = attributes;

	const { parents, post } = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } = select(
				coreStore
			);

			const parentEntities = [];

			const currentPost = getEditedEntityRecord(
				'postType',
				postType,
				postId
			);

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

			return {
				post: currentPost,
				parents: parentEntities.reverse(),
			};
		},
		[ postId, postType ]
	);

	// Set breadcrumb page titles to real titles if available, and
	// fall back to placeholder content.
	let breadcrumbTitles = parents.length
		? parents.map( ( parent ) => parent?.title?.rendered || ' ' )
		: [ __( 'Root' ), __( 'Top-level page' ), __( 'Child page' ) ];

	if ( nestingLevel > 0 ) {
		breadcrumbTitles = breadcrumbTitles.slice( -nestingLevel );
	}

	const buildBreadcrumb = (
		crumbTitle,
		showSeparator,
		addLeadingSeparator,
		key
	) => {
		let separatorSpan;
		let crumbAnchor;

		if ( showSeparator && separator ) {
			separatorSpan = (
				<span className="wp-block-breadcrumbs__separator">
					{ separator }
				</span>
			);
		}

		if ( crumbTitle ) {
			/* eslint-disable jsx-a11y/anchor-is-valid */
			crumbAnchor = (
				<a href="#" onClick={ ( event ) => event.preventDefault() }>
					{ crumbTitle }
				</a>
			);
			/* eslint-enable */
		}

		return (
			<li className="wp-block-breadcrumbs__item" key={ key }>
				{ addLeadingSeparator ? separatorSpan : null }
				{ crumbAnchor }
				{ separatorSpan }
			</li>
		);
	};

	const breadcrumbs = [];

	// Add a useMemo on this one?
	breadcrumbs.push(
		...breadcrumbTitles.map( ( item, index ) =>
			buildBreadcrumb(
				item,
				index < breadcrumbTitles.length - 1 || showCurrentPageTitle,
				index === 0 && showLeadingSeparator,
				index
			)
		)
	);

	if ( showCurrentPageTitle ) {
		breadcrumbs.push(
			buildBreadcrumb(
				post?.title || __( 'Current page' ),
				false,
				false,
				breadcrumbTitles.length
			)
		);
	}

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
				</PanelBody>
			</InspectorControls>
			<nav { ...blockProps }>
				<ol>{ breadcrumbs }</ol>
			</nav>
		</>
	);
}
