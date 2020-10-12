/**
 * WordPress dependencies
 */

import { Fragment } from '@wordpress/element';

import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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

export function SocialLinksEdit( props ) {
	const {
		attributes: { openInNewTab },
		setAttributes,
	} = props;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		templateLock: false,
		template: TEMPLATE,
		orientation: 'horizontal',
		__experimentalAppenderTagName: 'li',
	} );
	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open links in new tab' ) }
						checked={ openInNewTab }
						onChange={ () =>
							setAttributes( { openInNewTab: ! openInNewTab } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</Fragment>
	);
}

export default SocialLinksEdit;
