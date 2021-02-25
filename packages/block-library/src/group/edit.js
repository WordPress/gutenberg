/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';
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
	const blockProps = useBlockProps();
	const { tagName: TagName = 'div', templateLock, layout = {} } = attributes;
	const { contentSize, wideSize } = layout;
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: classnames( 'wp-block-group__inner-container', {
				[ `wp-container-${ layout.id }` ]: !! layout.id,
			} ),
		},
		{
			templateLock,
			renderAppender: hasInnerBlocks
				? undefined
				: InnerBlocks.ButtonBlockAppender,
			__experimentalLayout: {
				type: 'default',
				alignments:
					contentSize || wideSize
						? [ 'wide', 'full' ]
						: [ 'left', 'center', 'right' ],
			},
		}
	);

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
										id: layout.id ?? uuid(),
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
									id: layout.id ?? uuid(),
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
									id: layout.id ?? uuid(),
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
			<TagName { ...blockProps }>
				{ ( wideSize || contentSize ) && (
					<style>
						{ `
							.wp-container-${ layout.id } > * {
								max-width: ${ contentSize ?? wideSize };
								margin-left: auto;
								margin-right: auto;
							}
						
							.wp-container-${ layout.id } > [data-align="wide"] {
								max-width: ${ wideSize ?? contentSize };
							}
						
							.wp-container-${ layout.id } > [data-align="full"] {
								max-width: none;
							}
						` }
					</style>
				) }
				<BoxControlVisualizer
					values={ attributes.style?.spacing?.padding }
					showValues={ attributes.style?.visualizers?.padding }
				/>
				<div { ...innerBlocksProps } />
			</TagName>
		</>
	);
}

export default GroupEdit;
