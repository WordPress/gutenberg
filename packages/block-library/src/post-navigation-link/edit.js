/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	ToggleControl,
	SelectControl,
	PanelBody,
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
	context: { postType },
	attributes: {
		type,
		label,
		showTitle,
		textAlign,
		linkLabel,
		arrow,
		taxonomy,
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
		placeholder = isNext
			? /* translators: Label before for next and previous post. There is a space after the colon. */
			  __( 'Next: ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
			: /* translators: Label before for next and previous post. There is a space after the colon. */
			  __( 'Previous: ' ); // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
	}

	const ariaLabel = isNext ? __( 'Next post' ) : __( 'Previous post' );
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const taxonomies = useSelect(
		( select ) => {
			const { getTaxonomies } = select( coreStore );
			const filteredTaxonomies = getTaxonomies( {
				type: postType,
				per_page: -1,
			} );
			return filteredTaxonomies;
		},
		[ postType ]
	);
	const getTaxonomyOptions = () => {
		const selectOption = {
			label: __( 'Unfiltered' ),
			value: '',
		};
		const taxonomyOptions = ( taxonomies ?? [] )
			.filter( ( { visibility } ) => !! visibility?.publicly_queryable )
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
						__next40pxDefaultSize
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
			</InspectorControls>
			<InspectorControls group="advanced">
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Filter by taxonomy' ) }
					value={ taxonomy }
					options={ getTaxonomyOptions() }
					onChange={ ( value ) =>
						setAttributes( {
							taxonomy: value,
						} )
					}
					help={ __(
						'Only link to posts that have the same taxonomy terms as the current post. For example the same tags or categories.'
					) }
				/>
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
					identifier="label"
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
						aria-hidden
					>
						{ displayArrow }
					</span>
				) }
			</div>
		</>
	);
}
