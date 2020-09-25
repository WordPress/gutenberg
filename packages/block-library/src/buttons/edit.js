/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
	BlockControls,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button';
import ContentJustificationDropdown from './content-justification-dropdown';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

// Inside buttons block alignment options are not supported.
const alignmentHooksSetting = {
	isEmbedButton: true,
};

function ButtonsEdit( {
	attributes: { contentJustification },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `is-content-justification-${ contentJustification }` ]: contentJustification,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: BUTTONS_TEMPLATE,
		orientation: 'horizontal',
	} );
	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ ( toggleProps ) => (
							<ContentJustificationDropdown
								toggleProps={ toggleProps }
								value={ contentJustification }
								onChange={ ( updatedValue ) => {
									setAttributes( {
										contentJustification: updatedValue,
									} );
								} }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
			<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
				<div { ...innerBlocksProps } />
			</AlignmentHookSettingsProvider>
		</>
	);
}

export default ButtonsEdit;
