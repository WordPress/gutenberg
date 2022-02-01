/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	stretchFullWidth,
	justifySpaceBetween,
	arrowRight,
	arrowDown,
} from '@wordpress/icons';
import { Button, ToggleControl, Flex, FlexItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { appendSelectors } from './utils';
import useSetting from '../components/use-setting';
import { BlockControls, JustifyContentControl } from '../components';

// Used with the default, horizontal flex orientation.
const justifyContentMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	'space-between': 'space-between',
};

// Used with the vertical (column) flex orientation.
const alignItemsMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
};

const flexWrapOptions = [ 'wrap', 'nowrap' ];

export default {
	name: 'flex',
	label: __( 'Flex' ),
	inspectorControls: function FlexLayoutInspectorControls( {
		layout = {},
		onChange,
	} ) {
		const { allowOrientation = true } = layout;
		return (
			<>
				<Flex>
					<FlexItem>
						<FlexLayoutJustifyContentControl
							layout={ layout }
							onChange={ onChange }
						/>
					</FlexItem>
					<FlexItem>
						{ allowOrientation && (
							<OrientationControl
								layout={ layout }
								onChange={ onChange }
							/>
						) }
					</FlexItem>
				</Flex>
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
	save: function FlexLayoutStyle( { selector, layout, style } ) {
		const { orientation = 'horizontal' } = layout;
		const blockGapSupport = useSetting( 'spacing.blockGap' );
		const hasBlockGapStylesSupport = blockGapSupport !== null;
		const blockGapValue =
			style?.spacing?.blockGap ?? 'var( --wp--style--block-gap, 0.5em )';
		const justifyContent =
			justifyContentMap[ layout.justifyContent ] ||
			justifyContentMap.left;
		const flexWrap = flexWrapOptions.includes( layout.flexWrap )
			? layout.flexWrap
			: 'wrap';
		const rowOrientation = `
		flex-direction: row;
		align-items: center;
		justify-content: ${ justifyContent };
		`;
		const alignItems =
			alignItemsMap[ layout.justifyContent ] || alignItemsMap.left;
		const columnOrientation = `
		flex-direction: column;
		align-items: ${ alignItems };
		`;

		return (
			<style>{ `
				${ appendSelectors( selector ) } {
					display: flex;
					gap: ${ hasBlockGapStylesSupport ? blockGapValue : '0.5em' };
					flex-wrap: ${ flexWrap };
					${ orientation === 'horizontal' ? rowOrientation : columnOrientation }
				}

				${ appendSelectors( selector, '> *' ) } {
					margin: 0;
				}
			` }</style>
		);
	},
	getOrientation( layout ) {
		const { orientation = 'horizontal' } = layout;
		return orientation;
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
	const { justifyContent = 'left', orientation = 'horizontal' } = layout;
	const onJustificationChange = ( value ) => {
		onChange( {
			...layout,
			justifyContent: value,
		} );
	};
	const allowedControls = [ 'left', 'center', 'right' ];
	if ( orientation === 'horizontal' ) {
		allowedControls.push( 'space-between' );
	}
	if ( isToolbar ) {
		return (
			<JustifyContentControl
				allowedControls={ allowedControls }
				value={ justifyContent }
				onChange={ onJustificationChange }
				popoverProps={ {
					position: 'bottom right',
					isAlternate: true,
				} }
			/>
		);
	}

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
	];
	if ( orientation === 'horizontal' ) {
		justificationOptions.push( {
			value: 'space-between',
			icon: justifySpaceBetween,
			label: __( 'Space between items' ),
		} );
	} else {
		justificationOptions.push({
			value: 'stretch',
			icon: stretchFullWidth,
			label: __( 'Justify items stretched' ),
		},)
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
	const { flexWrap = 'wrap' } = layout;
	return (
		<ToggleControl
			label={ __( 'Allow to wrap to multiple lines' ) }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					flexWrap: value ? 'wrap' : 'nowrap',
				} );
			} }
			checked={ flexWrap === 'wrap' }
		/>
	);
}

function OrientationControl( { layout, onChange } ) {
	const { orientation = 'horizontal' } = layout;
	return (
		<fieldset className="block-editor-hooks__flex-layout-orientation-controls">
			<legend>{ __( 'Orientation' ) }</legend>
			<Button
				label={ 'horizontal' }
				icon={ arrowRight }
				isPressed={ orientation === 'horizontal' }
				onClick={ () =>
					onChange( {
						...layout,
						orientation: 'horizontal',
					} )
				}
			/>
			<Button
				label={ 'vertical' }
				icon={ arrowDown }
				isPressed={ orientation === 'vertical' }
				onClick={ () =>
					onChange( {
						...layout,
						orientation: 'vertical',
					} )
				}
			/>
		</fieldset>
	);
}
