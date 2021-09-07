/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
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

export default {
	name: 'flex',
	label: __( 'Flex' ),
	inspectorControls: function FlexLayoutInspectorControls( {
		layout = {},
		onChange,
	} ) {
		return (
			<FlexLayoutJustifyContentControl
				layout={ layout }
				onChange={ onChange }
			/>
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
			<BlockControls group="block" __experimentalExposeToChildren>
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
			justifyContentMap[ layout.justifyContent ] || 'flex-start';
		return (
			<style>{ `
				${ appendSelectors( selector ) } {
					display: flex;
					gap: ${
						hasBlockGapStylesSupport
							? 'var( --wp--style--block-gap, 0.5em )'
							: '0.5em'
					};
					flex-wrap: wrap;
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

function FlexLayoutJustifyContentControl( {
	layout,
	onChange,
	isToolbar = false,
} ) {
	const { justifyContent = 'left' } = layout;
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
				onChange={ ( value ) => {
					onChange( {
						...layout,
						justifyContent: value,
					} );
				} }
				popoverProps={ {
					position: 'bottom right',
					isAlternate: true,
				} }
			/>
		);
	}
	return (
		<ToggleGroupControl
			label={ __( 'Justify content' ) }
			value={ justifyContent }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					justifyContent: value,
				} );
			} }
			isBlock
		>
			<ToggleGroupControlOption
				value="left"
				label={ _x( 'Left', 'Justify content option' ) }
			/>
			<ToggleGroupControlOption
				value="center"
				label={ _x( 'Center', 'Justify content option' ) }
			/>
			<ToggleGroupControlOption
				value="right"
				label={ _x( 'Right', 'Justify content option' ) }
			/>
			<ToggleGroupControlOption
				value="space-between"
				label={ _x( 'Space between', 'Justify content option' ) }
			/>
		</ToggleGroupControl>
	);
}
