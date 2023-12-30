/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Disabled,
	PanelBody,
	RangeControl,
	ToggleControl,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { __ } from '@wordpress/i18n';

/**
 * Minimum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MIN_COMMENTS = 1;
/**
 * Maximum number of comments a user can show using this block.
 *
 * @type {number}
 */
const MAX_COMMENTS = 100;

export default function LatestComments( { attributes, setAttributes } ) {
	const { commentsToShow, displayAvatar, displayDate, displayExcerpt } =
		attributes;

	const serverSideAttributes = {
		...attributes,
		style: {
			...attributes?.style,
			spacing: undefined,
		},
	};

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display avatar' ) }
						checked={ displayAvatar }
						onChange={ () =>
							setAttributes( { displayAvatar: ! displayAvatar } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display date' ) }
						checked={ displayDate }
						onChange={ () =>
							setAttributes( { displayDate: ! displayDate } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display excerpt' ) }
						checked={ displayExcerpt }
						onChange={ () =>
							setAttributes( {
								displayExcerpt: ! displayExcerpt,
							} )
						}
					/>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Number of comments' ) }
						value={ commentsToShow }
						onChange={ ( value ) =>
							setAttributes( { commentsToShow: value } )
						}
						min={ MIN_COMMENTS }
						max={ MAX_COMMENTS }
						required
					/>
				</PanelBody>
			</InspectorControls>
			<Disabled>
				<ServerSideRender
					block="core/latest-comments"
					attributes={ serverSideAttributes }
					// The preview uses the site's locale to make it more true to how
					// the block appears on the frontend. Setting the locale
					// explicitly prevents any middleware from setting it to 'user'.
					urlQueryArgs={ { _locale: 'site' } }
				/>
			</Disabled>
		</div>
	);
}
