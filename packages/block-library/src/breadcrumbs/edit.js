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
	attributes: {
		nestingLevel,
		separator,
		showCurrentPageTitle,
		showLeadingSeparator,
		textAlign,
	},
	setAttributes,
	context: { postType, postId },
} ) {
	const post = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	if ( ! post ) {
		return null;
	}

	const postTitle = post.title || '';

	const placeholderItems = [
		__( 'Root' ),
		__( 'Top-level page' ),
		__( 'Child page' ),
	];

	const buildBreadcrumb = ( crumbTitle, showSeparator, key ) => {
		let separatorSpan;

		if ( showSeparator && separator ) {
			separatorSpan = (
				<span className="wp-block-breadcrumbs__separator">
					{ separator }
				</span>
			);
		}

		return (
			<li className="wp-block-breadcrumbs__item" key={ key }>
				{ separatorSpan }
				{ /* eslint-disable jsx-a11y/anchor-is-valid */ }
				<a href="#">{ crumbTitle }</a>
				{ /* eslint-enable */ }
			</li>
		);
	};

	const placeholder = placeholderItems.map( ( item, index ) =>
		buildBreadcrumb( item, index !== 0 || showLeadingSeparator, index )
	);

	if ( showCurrentPageTitle && postTitle ) {
		placeholder.push(
			buildBreadcrumb( postTitle, true, placeholderItems.length )
		);
	}

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
				<PanelBody title={ __( 'Breadcrumbs settings' ) }>
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
						placeholder={ __( 'e.g. /' ) }
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
				<ol>{ placeholder }</ol>
			</nav>
		</>
	);
}
