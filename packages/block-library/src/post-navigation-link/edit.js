/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
	SelectControl,
	PanelBody,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import {
	InspectorControls,
	RichText,
	BlockControls,
	AlignmentToolbar,
	useBlockProps,
} from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function PostNavigationLinkEdit( {
	attributes: {
		type,
		label,
		showTitle,
		textAlign,
		linkLabel,
		arrow,
		inSameTerm,
		taxonomy,
		excludedTerms,
	},
	setAttributes,
} ) {
	const isNext = type === 'next';
	let placeholder = isNext ? __( 'Next' ) : __( 'Previous' );

	const arrowMap = {
		none: '',
		arrow: isNext ? '→' : '←',
		chevron: isNext ? '»' : '«',
	};

	const displayArrow = arrowMap[ arrow ];

	if ( showTitle ) {
		/* translators: Label before for next and previous post. There is a space after the colon. */
		placeholder = isNext ? __( 'Next: ' ) : __( 'Previous: ' );
	}

	const ariaLabel = isNext ? __( 'Next post' ) : __( 'Previous post' );
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	// We need to know the post type in order to get all supported taxonomies.
	const postType = useSelect(
		// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		( select ) => select( 'core/editor' ).getCurrentPostType(),
		[]
	);
	const taxonomies = useSelect(
		( select ) => {
			const { getTaxonomies } = select( coreStore );
			const filteredTaxonomies = getTaxonomies( {
				type: postType,
				per_page: -1,
				context: 'view',
			} );
			return filteredTaxonomies;
		},
		[ postType ]
	);
	const getTaxonomyOptions = () => {
		const selectOption = {
			label: __( '- Select -' ),
			value: '',
			disabled: true,
		};
		const taxonomyOptions = ( taxonomies ?? [] )
			.filter( ( tax ) => tax.slug !== 'nav_menu' )
			.map( ( item ) => {
				return {
					value: item.slug,
					label: item.name,
				};
			} );

		return [ selectOption, ...taxonomyOptions ];
	};

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display the title as a link' ) }
						help={ __(
							'If you have entered a custom label, it will be prepended before the title.'
						) }
						checked={ !! showTitle }
						onChange={ () =>
							setAttributes( {
								showTitle: ! showTitle,
							} )
						}
					/>
					{ showTitle && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __(
								'Include the label as part of the link'
							) }
							checked={ !! linkLabel }
							onChange={ () =>
								setAttributes( {
									linkLabel: ! linkLabel,
								} )
							}
						/>
					) }
					<ToggleGroupControl
						__nextHasNoMarginBottom
						label={ __( 'Arrow' ) }
						value={ arrow }
						onChange={ ( value ) => {
							setAttributes( { arrow: value } );
						} }
						help={ __(
							'A decorative arrow for the next and previous link.'
						) }
						isBlock
					>
						<ToggleGroupControlOption
							value="none"
							label={ _x(
								'None',
								'Arrow option for Next/Previous link'
							) }
						/>
						<ToggleGroupControlOption
							value="arrow"
							label={ _x(
								'Arrow',
								'Arrow option for Next/Previous link'
							) }
						/>
						<ToggleGroupControlOption
							value="chevron"
							label={ _x(
								'Chevron',
								'Arrow option for Next/Previous link'
							) }
						/>
					</ToggleGroupControl>
				</PanelBody>
				<PanelBody title={ __( 'Filters' ) }>
					<ToggleControl
						label={ __( 'Filter by taxonomy' ) }
						checked={ !! inSameTerm }
						onChange={ () =>
							setAttributes( {
								inSameTerm: ! inSameTerm,
							} )
						}
					/>
					{ inSameTerm && (
						<SelectControl
							label={ __( 'Taxonomy' ) }
							value={ taxonomy }
							options={ getTaxonomyOptions() }
							onChange={ ( value ) =>
								setAttributes( { taxonomy: value } )
							}
						/>
					) }
					<InputControl
						label={ __( 'Add terms to exclude' ) }
						help={ __( 'Separate terms with comma.' ) }
						value={ excludedTerms }
						onChange={ ( value ) =>
							setAttributes( { excludedTerms: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ ! isNext && displayArrow && (
					<span
						className={ `wp-block-post-navigation-link__arrow-previous is-arrow-${ arrow }` }
					>
						{ displayArrow }
					</span>
				) }
				<RichText
					tagName="a"
					aria-label={ ariaLabel }
					placeholder={ placeholder }
					value={ label }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
					onChange={ ( newLabel ) =>
						setAttributes( { label: newLabel } )
					}
				/>
				{ showTitle && (
					<a
						href="#post-navigation-pseudo-link"
						onClick={ ( event ) => event.preventDefault() }
					>
						{ __( 'An example title' ) }
					</a>
				) }
				{ isNext && displayArrow && (
					<span
						className={ `wp-block-post-navigation-link__arrow-next is-arrow-${ arrow }` }
						aria-hidden={ true }
					>
						{ displayArrow }
					</span>
				) }
			</div>
		</>
	);
}
