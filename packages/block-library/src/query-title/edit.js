/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
// import { useSelect, useDispatch } from '@wordpress/data';
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
	Warning,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

export default function QueryTitleEdit( {
	attributes: { content, type, level, textAlign },
	setAttributes,
} ) {
	const TagName = `h${ level }`;
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-query-title__placeholder', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	let titleElement;
	if ( type === 'archive' ) {
		titleElement = (
			<TagName { ...blockProps }>{ __( 'Archive title' ) }</TagName>
		);
	} else {
		titleElement = (
			<div { ...blockProps }>
				<RichText
					tagName={ TagName }
					value={ content }
					placeholder={ __( 'Query title' ) }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
					onChange={ ( newContent ) =>
						setAttributes( { content: newContent } )
					}
					disableLineBreaks={ true }
				/>
			</div>
		);
	}
	return (
		<>
			<BlockControls group="block">
				<HeadingLevelDropdown
					selectedLevel={ level }
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
			{ titleElement }
		</>
	);
}
