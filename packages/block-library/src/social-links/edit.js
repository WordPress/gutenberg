/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

const ALLOWED_BLOCKS = [ 'core/social-link' ];

// Template contains the links that show when start.
const TEMPLATE = [
	[
		'core/social-link',
		{ service: 'wordpress', url: 'https://wordpress.org' },
	],
	[ 'core/social-link', { service: 'facebook' } ],
	[ 'core/social-link', { service: 'twitter' } ],
	[ 'core/social-link', { service: 'instagram' } ],
	[ 'core/social-link', { service: 'linkedin' } ],
	[ 'core/social-link', { service: 'youtube' } ],
];

export const SocialLinksEdit = function( {
	className,
	attributes,
	setAttributes,
} ) {
	const { inheritColors } = attributes;

	return (
		<>
			<div
				className={ classnames( className, {
					'has-inherited-color': inheritColors,
				} ) }
			>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					templateLock={ false }
					template={ TEMPLATE }
					__experimentalMoverDirection={ 'horizontal' }
				/>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Social Links settings' ) }>
					<ToggleControl
						label={ __( 'Inherit colors' ) }
						checked={ !! inheritColors }
						onChange={ () =>
							setAttributes( { inheritColors: ! inheritColors } )
						}
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default SocialLinksEdit;
