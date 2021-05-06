/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	JustifyContentControl,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

function ButtonsEdit( {
	attributes: { contentJustification, orientation },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `is-content-justification-${ contentJustification }` ]: contentJustification,
			'is-vertical': orientation === 'vertical',
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: BUTTONS_TEMPLATE,
		orientation,
		__experimentalLayout: {
			type: 'default',
			alignments: [],
		},
		templateInsertUpdatesSelection: true,
	} );

	const justifyControls =
		orientation === 'vertical'
			? [ 'left', 'center', 'right' ]
			: [ 'left', 'center', 'right', 'space-between' ];

	return (
		<>
			<BlockControls group="block">
				<JustifyContentControl
					allowedControls={ justifyControls }
					value={ contentJustification }
					onChange={ ( value ) =>
						setAttributes( { contentJustification: value } )
					}
					popoverProps={ {
						position: 'bottom right',
						isAlternate: true,
					} }
				/>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ButtonsEdit;
