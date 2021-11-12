/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( {
	attributes: { linkTarget, textAlign },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const blockControls = (
		<BlockControls group="block">
			<AlignmentControl
				value={ textAlign }
				onChange={ ( newAlign ) =>
					setAttributes( { textAlign: newAlign } )
				}
			/>
		</BlockControls>
	);
	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Link settings' ) }>
				<ToggleControl
					label={ __( 'Open in new tab' ) }
					onChange={ ( value ) =>
						setAttributes( {
							linkTarget: value ? '_blank' : '_self',
						} )
					}
					checked={ linkTarget === '_blank' }
				/>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...blockProps }>
				<a
					href="#edit-comment-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'Edit' ) }
				</a>
			</div>
		</>
	);
}
