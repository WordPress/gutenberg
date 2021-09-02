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

export default {
	name: 'flex',
	label: __( 'Flex' ),
	edit: function LayoutFlexEdit( { layout = {}, onChange } ) {
		const { justifyContent = 'flex-start' } = layout;
		return (
			<ToggleGroupControl
				label={ __( 'Justify content' ) }
				value={ justifyContent }
				help={ __( 'Add some help here??' ) }
				onChange={ ( value ) => {
					onChange( {
						...layout,
						justifyContent: value,
					} );
				} }
				isBlock
			>
				<ToggleGroupControlOption
					value="flex-start"
					label={ _x( 'Left', 'Justify content option' ) }
				/>
				<ToggleGroupControlOption
					value="center"
					label={ _x( 'Center', 'Justify content option' ) }
				/>
				<ToggleGroupControlOption
					value="flex-end"
					label={ _x( 'Right', 'Justify content option' ) }
				/>
				<ToggleGroupControlOption
					value="space-between"
					label={ _x( 'Space between', 'Justify content option' ) }
				/>
			</ToggleGroupControl>
		);
	},
	save: function FlexLayoutStyle( { selector, layout } ) {
		const blockGapSupport = useSetting( 'spacing.blockGap' );
		const hasBlockGapStylesSupport = blockGapSupport !== null;
		const { justifyContent = 'flex-start' } = layout;
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
