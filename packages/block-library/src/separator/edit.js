/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	HorizontalRule,
	__experimentalBoxControl as BoxControl,
} from '@wordpress/components';
import { View } from '@wordpress/primitives';
import { withColors, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { MARGIN_CONSTRAINTS, parseUnit } from './shared';

const { __Visualizer: BoxControlVisualizer } = BoxControl;

function SeparatorEdit( props ) {
	const {
		color,
		attributes: { style },
	} = props;

	const { top, bottom } = style?.spacing?.margin || {};
	const marginUnit = parseUnit( top || bottom );
	const blockProps = useBlockProps();

	return (
		<>
			<View
				{ ...blockProps }
				className={ blockProps.className?.replace(
					'wp-block-separator',
					'wp-block-separator-wrapper'
				) }
			>
				<BoxControlVisualizer
					values={ style?.spacing?.margin }
					showValues={ style?.visualizers?.margin }
				/>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
						marginTop: top || MARGIN_CONSTRAINTS[ marginUnit ].min,
						marginBottom:
							bottom || MARGIN_CONSTRAINTS[ marginUnit ].min,
					} }
				/>
			</View>
			<SeparatorSettings { ...props } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
