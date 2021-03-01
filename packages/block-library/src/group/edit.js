/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorAdvancedControls,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	SelectControl,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
const { __Visualizer: BoxControlVisualizer } = BoxControl;

const isWeb = Platform.OS === 'web';

export const CSS_UNITS = [
	{
		value: '%',
		label: isWeb ? '%' : __( 'Percentage (%)' ),
		default: '',
	},
	{
		value: 'px',
		label: isWeb ? 'px' : __( 'Pixels (px)' ),
		default: '',
	},
	{
		value: 'em',
		label: isWeb ? 'em' : __( 'Relative to parent font size (em)' ),
		default: '',
	},
	{
		value: 'rem',
		label: isWeb ? 'rem' : __( 'Relative to root font size (rem)' ),
		default: '',
	},
	{
		value: 'vw',
		label: isWeb ? 'vw' : __( 'Viewport width (vw)' ),
		default: '',
	},
];

function GroupEdit( { attributes, setAttributes, clientId } ) {
	const hasInnerBlocks = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const block = getBlock( clientId );
			return !! ( block && block.innerBlocks.length );
		},
		[ clientId ]
	);
	const { tagName: TagName = 'div', templateLock, layout = {} } = attributes;
	const { contentSize, wideSize } = layout;
	const blockProps = useBlockProps();
	/* TODO: find a way to render this extra div as a child of the inner block wrapper 
	const extraChildren = (
		<BoxControlVisualizer
			values={ attributes.style?.spacing?.padding }
			showValues={ attributes.style?.visualizers?.padding }
		/>
	);
	*/
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock,
		renderAppender: hasInnerBlocks
			? undefined
			: InnerBlocks.ButtonBlockAppender,
		__experimentalLayout: {
			type: 'default',
			// TODO: only pass this if the theme supports the new alignments.
			// otherwise make all alignments avaiable.
			// Find a way to inject this using the support flag.
			alignments:
				contentSize || wideSize
					? [ 'wide', 'full' ]
					: [ 'left', 'center', 'right' ],
		},
	} );

	return (
		<>
			<InspectorAdvancedControls>
				<SelectControl
					label={ __( 'HTML element' ) }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<header>', value: 'header' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<article>', value: 'article' },
						{ label: '<aside>', value: 'aside' },
						{ label: '<footer>', value: 'footer' },
					] }
					value={ TagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorAdvancedControls>
			<TagName { ...innerBlocksProps } />
		</>
	);
}

export default GroupEdit;
