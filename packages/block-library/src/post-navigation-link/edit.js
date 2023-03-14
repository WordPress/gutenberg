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

export default function PostNavigationLinkEdit( {
	attributes: {
		type,
		label,
		showTitle,
		textAlign,
		linkLabel,
		arrow,
		arrowOnly,
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
								arrowOnly: false,
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
					{ arrow !== 'none' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display arrow without text' ) }
							checked={ !! arrowOnly }
							onChange={ () =>
								setAttributes( {
									arrowOnly: ! arrowOnly,
									showTitle: false,
								} )
							}
						/>
					) }
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
				{ ! isNext && displayArrow && arrowOnly && (
					<a
						href="#post-navigation-pseudo-link"
						onClick={ ( event ) => event.preventDefault() }
					>
						<span
							className={ `wp-block-post-navigation-link__arrow-previous is-arrow-${ arrow }` }
						>
							{ displayArrow }
						</span>
					</a>
				) }
				{ ! isNext && displayArrow && ! arrowOnly && (
					<span
						className={ `wp-block-post-navigation-link__arrow-previous is-arrow-${ arrow }` }
					>
						{ displayArrow }
					</span>
				) }
				{ ! arrowOnly && (
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
				) }
				{ showTitle && ! arrowOnly && (
					<a
						href="#post-navigation-pseudo-link"
						onClick={ ( event ) => event.preventDefault() }
					>
						{ __( 'An example title' ) }
					</a>
				) }
				{ isNext && displayArrow && ! arrowOnly && (
					<span
						className={ `wp-block-post-navigation-link__arrow-next is-arrow-${ arrow }` }
						aria-hidden={ true }
					>
						{ displayArrow }
					</span>
				) }
				{ isNext && displayArrow && arrowOnly && (
					<a
						href="#post-navigation-pseudo-link"
						onClick={ ( event ) => event.preventDefault() }
					>
						<span
							className={ `wp-block-post-navigation-link__arrow-next is-arrow-${ arrow }` }
						>
							{ displayArrow }
						</span>
					</a>
				) }
			</div>
		</>
	);
}
