/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	AlignmentControl,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import LevelControl from './level-toolbar';

export default function SiteTitleEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
} ) {
	const { level, textAlign, style: { typography } = {} } = attributes;
	const [ title, setTitle ] = useEntityProp( 'root', 'site', 'title' );
	const TagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	// Text decoration is not applied to a nested inline block so need to pass this down to
	// richtext child element.
	const textDecoration = typography?.textDecoration
		? typography?.textDecoration
		: undefined;

	return (
		<>
			<BlockControls group="block">
				<LevelControl
					level={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<TagName { ...blockProps }>
				<RichText
					tagName="a"
					style={ {
						display: 'inline-block',
						textDecoration,
					} }
					aria-label={ __( 'Site title text' ) }
					placeholder={ __( 'Write site title…' ) }
					value={ title }
					onChange={ setTitle }
					allowedFormats={ [] }
					disableLineBreaks
					__unstableOnSplitAtEnd={ () =>
						insertBlocksAfter(
							createBlock( getDefaultBlockName() )
						)
					}
				/>
			</TagName>
		</>
	);
}
