/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorAdvancedControls,
	InspectorControls,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	SelectControl,
	PanelBody,
	__experimentalBoxControl as BoxControl,
	__experimentalUnitControl as UnitControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
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
	const id = useInstanceId( GroupEdit );
	const { defaultLayout, hasInnerBlocks } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				defaultLayout: getSettings().__experimentalFeatures?.defaults
					?.layout,
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			};
		},
		[ clientId ]
	);
	const { tagName: TagName = 'div', templateLock, layout = {} } = attributes;
	const { contentSize, wideSize } = layout;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `wp-container-${ id }` ]: contentSize || wideSize,
		} ),
	} );
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
			alignments:
				contentSize || wideSize
					? [ 'wide', 'full' ]
					: [ 'left', 'center', 'right' ],
		},
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Layout settings' ) }>
					{ !! defaultLayout && (
						<Button
							isSecondary
							onClick={ () => {
								setAttributes( {
									layout: {
										...defaultLayout,
									},
								} );
							} }
						>
							{ __( 'Use default layout' ) }
						</Button>
					) }
					<UnitControl
						label={ __( 'Content size' ) }
						labelPosition="edge"
						__unstableInputWidth="80px"
						value={ contentSize || wideSize || '' }
						onChange={ ( nextWidth ) => {
							nextWidth =
								0 > parseFloat( nextWidth ) ? '0' : nextWidth;
							setAttributes( {
								layout: {
									...layout,
									contentSize: nextWidth,
								},
							} );
						} }
						units={ CSS_UNITS }
					/>
					<UnitControl
						label={ __( 'Wide size' ) }
						labelPosition="edge"
						__unstableInputWidth="80px"
						value={ wideSize || contentSize || '' }
						onChange={ ( nextWidth ) => {
							nextWidth =
								0 > parseFloat( nextWidth ) ? '0' : nextWidth;
							setAttributes( {
								layout: {
									...layout,
									wideSize: nextWidth,
								},
							} );
						} }
						units={ CSS_UNITS }
					/>
				</PanelBody>
			</InspectorControls>
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
			{ ( wideSize || contentSize ) && (
				<style>
					{ `
							.wp-container-${ id } > * {
								max-width: ${ contentSize ?? wideSize };
								margin-left: auto;
								margin-right: auto;
							}
						
							.wp-container-${ id } > [data-align="wide"] {
								max-width: ${ wideSize ?? contentSize };
							}
						
							.wp-container-${ id } > [data-align="full"] {
								max-width: none;
							}
						` }
				</style>
			) }
			<TagName { ...innerBlocksProps } />
		</>
	);
}

export default GroupEdit;
