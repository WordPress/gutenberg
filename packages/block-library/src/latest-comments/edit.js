/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
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
	const {
		commentsToShow,
		displayAvatar,
		displayDate,
		displayExcerpt,
	} = attributes;

	const toggleAttribute = ( propName ) => {
		return () => {
			const value = attributes[ propName ];
			setAttributes( { [ propName ]: ! value } );
		};
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Latest comments settings' ) }>
					<ToggleControl
						label={ __( 'Display avatar' ) }
						checked={ displayAvatar }
						onChange={ toggleAttribute( 'displayAvatar' ) }
					/>
					<ToggleControl
						label={ __( 'Display date' ) }
						checked={ displayDate }
						onChange={ toggleAttribute( 'displayDate' ) }
					/>
					<ToggleControl
						label={ __( 'Display excerpt' ) }
						checked={ displayExcerpt }
						onChange={ toggleAttribute( 'displayExcerpt' ) }
					/>
					<RangeControl
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
					attributes={ attributes }
				/>
			</Disabled>
		</>
	);
}
