/**
 * WordPress dependencies
 */
import { ToggleControl, PanelBody } from '@wordpress/components';
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function PostNavigationNextEdit( {
	attributes: { type, label, showTitle },
	setAttributes,
} ) {
	const isNext = type === 'next';
	const placeholder = isNext ? __( 'Next' ) : __( 'Previous' );
	const ariaLabel = isNext
		? __( 'Next post link' )
		: __( 'Previous post link' );
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
			<div { ...useBlockProps() }>
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
