/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	JustifyContentControl,
	__experimentalBlockPatternSetup as BlockPatternSetup,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

function ButtonsContent( {
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

function ButtonsLayoutSetup( props ) {
	const { clientId, name: blockName } = props;
	const blockProps = useBlockProps();
	// Custom block patterns filtering for overriding the default scoped filtering.
	const filterPatternsFn = useCallback(
		( pattern ) =>
			[ 'buttons' ].some( ( category ) =>
				pattern.categories?.includes( category )
			) || pattern.scope?.block?.includes( blockName ),
		[]
	);
	// `startBlankComponent` is what to render when clicking `Start blank`
	// or if no matched patterns are found.
	return (
		<div { ...blockProps }>
			<BlockPatternSetup
				blockName={ blockName }
				clientId={ clientId }
				filterPatternsFn={ filterPatternsFn }
				startBlankComponent={ <ButtonsContent { ...props } /> }
			/>
		</div>
	);
}

function ButtonsEdit( props ) {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getBlocks( clientId ).length,
		[ clientId ]
	);
	// This logic should be handled per `block` basis.
	const Component = hasInnerBlocks ? ButtonsContent : ButtonsLayoutSetup;
	return <Component { ...props } />;
}

export default ButtonsEdit;
