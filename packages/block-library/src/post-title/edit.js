/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToggleControl,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

export default function PostTitleEdit( {
	attributes: { level, textAlign, makeLink, rel, linkTarget },
	setAttributes,
	context: { postType, postId },
} ) {
	const tagName = 0 === level ? 'p' : 'h' + level;

	const post = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	if ( ! post ) {
		return null;
	}

	const BlockWrapper = Block[ tagName ];
	let title = post.title || __( 'Post Title' );
	if ( makeLink ) {
		title = (
			<a href={ post.link } target={ linkTarget } rel={ rel }>
				{ title }
			</a>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<HeadingLevelDropdown
						selectedLevel={ level }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</ToolbarGroup>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Make title a link' ) }
						onChange={ () =>
							setAttributes( { makeLink: ! makeLink } )
						}
						checked={ makeLink }
					/>
					{ makeLink && (
						<>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
							<TextControl
								label={ __( 'Link rel' ) }
								value={ rel }
								onChange={ ( newRel ) =>
									setAttributes( { rel: newRel } )
								}
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<BlockWrapper
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				{ title }
			</BlockWrapper>
		</>
	);
}
