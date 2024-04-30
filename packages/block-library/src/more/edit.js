/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import {
	InspectorControls,
	useBlockProps,
	PlainText,
} from '@wordpress/block-editor';
import { getDefaultBlockName, createBlock } from '@wordpress/blocks';

const DEFAULT_TEXT = __( '(more…)' );

export default function MoreEdit( {
	attributes: { customText, noTeaser },
	insertBlocksAfter,
	setAttributes,
} ) {
	const getHideExcerptHelp = ( checked ) =>
		checked
			? __( 'The excerpt is hidden.' )
			: __( 'The excerpt is visible.' );

	const toggleHideExcerpt = () => setAttributes( { noTeaser: ! noTeaser } );

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Hide the excerpt on the full content page'
						) }
						checked={ !! noTeaser }
						onChange={ toggleHideExcerpt }
						help={ getHideExcerptHelp }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>
				<PlainText
					__experimentalVersion={ 2 }
					tagName="a"
					aria-label={ __( '“more” link text' ) }
					value={ customText || DEFAULT_TEXT }
					placeholder={ DEFAULT_TEXT }
					onChange={ ( value ) =>
						setAttributes( { customText: value } )
					}
					disableLineBreaks
					__unstableOnSplitAtEnd={ () =>
						insertBlocksAfter(
							createBlock( getDefaultBlockName() )
						)
					}
				/>
			</div>
		</>
	);
}
