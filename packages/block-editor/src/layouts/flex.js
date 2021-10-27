/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
} from '@wordpress/icons';
import {
	Button,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { appendSelectors } from './utils';
import useSetting from '../components/use-setting';
import { BlockControls, JustifyContentControl } from '../components';

const justifyContentMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	'space-between': 'space-between',
};

const flexWrapMap = {
	wrap: 'wrap',
	nowrap: 'nowrap',
};

export default {
	name: 'flex',
	label: __( 'Flex' ),
	inspectorControls: function FlexLayoutInspectorControls( {
		layout = {},
		onChange,
	} ) {
		return (
			<>
				<FlexLayoutJustifyContentControl
					layout={ layout }
					onChange={ onChange }
				/>
				<FlexWrapControl layout={ layout } onChange={ onChange } />
			</>
		);
	},
	toolBarControls: function FlexLayoutToolbarControls( {
		layout = {},
		onChange,
		layoutBlockSupport,
	} ) {
		if ( layoutBlockSupport?.allowSwitching ) {
			return null;
		}
		return (
			<BlockControls group="block" __experimentalShareWithChildBlocks>
				<FlexLayoutJustifyContentControl
					layout={ layout }
					onChange={ onChange }
					isToolbar
				/>
			</BlockControls>
		);
	},
	save: function FlexLayoutStyle( { selector, layout } ) {
		const blockGapSupport = useSetting( 'spacing.blockGap' );
		const hasBlockGapStylesSupport = blockGapSupport !== null;
		const justifyContent =
			justifyContentMap[ layout.justifyContent ] ||
			justifyContentMap.left;
		const flexWrap = flexWrapMap[ layout.flexWrap ] || flexWrapMap.wrap;
		return (
			<style>{ `
				${ appendSelectors( selector ) } {
					display: flex;
					gap: ${
						hasBlockGapStylesSupport
							? 'var( --wp--style--block-gap, 0.5em )'
							: '0.5em'
					};
					flex-wrap: ${ flexWrap };
					align-items: center;
					flex-direction: row;
					justify-content: ${ justifyContent };
				}

				${ appendSelectors( selector, '> *' ) } {
					margin: 0;
				}
			` }</style>
		);
	},
	getOrientation() {
		return 'horizontal';
	},
	getAlignments() {
		return [];
	},
};

const justificationOptions = [
	{
		value: 'left',
		icon: justifyLeft,
		label: __( 'Justify items left' ),
	},
	{
		value: 'center',
		icon: justifyCenter,
		label: __( 'Justify items center' ),
	},
	{
		value: 'right',
		icon: justifyRight,
		label: __( 'Justify items right' ),
	},
	{
		value: 'space-between',
		icon: justifySpaceBetween,
		label: __( 'Space between items' ),
	},
];
function FlexLayoutJustifyContentControl( {
	layout,
	onChange,
	isToolbar = false,
} ) {
	const { justifyContent = 'left' } = layout;
	const onJustificationChange = ( value ) => {
		onChange( {
			...layout,
			justifyContent: value,
		} );
	};
	if ( isToolbar ) {
		return (
			<JustifyContentControl
				allowedControls={ [
					'left',
					'center',
					'right',
					'space-between',
				] }
				value={ justifyContent }
				onChange={ onJustificationChange }
				popoverProps={ {
					position: 'bottom right',
					isAlternate: true,
				} }
			/>
		);
	}

	return (
		<fieldset className="block-editor-hooks__flex-layout-justification-controls">
			<legend>{ __( 'Justification' ) }</legend>
			<div>
				{ justificationOptions.map( ( { value, icon, label } ) => {
					return (
						<Button
							key={ value }
							label={ label }
							icon={ icon }
							isPressed={ justifyContent === value }
							onClick={ () => onJustificationChange( value ) }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}

function FlexWrapControl( { layout, onChange } ) {
	const { flexWrap = flexWrapMap.wrap } = layout;
	const helpTexts = {
		wrap: __( 'Items wrap onto multiple lines.' ),
		nowrap: __( 'Items are forced onto one line.' ),
	};
	return (
		<ToggleGroupControl
			label={ __( 'Flex wrap' ) }
			value={ flexWrap }
			help={ helpTexts[ flexWrap ] }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					flexWrap: value,
				} );
			} }
			isBlock
		>
			<ToggleGroupControlOption value="wrap" label={ __( 'Wrap' ) } />
			<ToggleGroupControlOption
				value="nowrap"
				label={ __( 'No Wrap' ) }
			/>
		</ToggleGroupControl>
	);
}
