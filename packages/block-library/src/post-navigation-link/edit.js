/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ToggleControl, PanelBody } from '@wordpress/components';
import {
	InspectorControls,
	RichText,
	BlockControls,
	AlignmentToolbar,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function PostNavigationLinkEdit( {
	attributes: { type, label, showTitle, textAlign },
	setAttributes,
} ) {
	const isNext = type === 'next';
	const placeholder = isNext ? __( 'Next' ) : __( 'Previous' );
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
			</div>
		</>
	);
}
