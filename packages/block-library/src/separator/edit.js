/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	Component,
} from '@wordpress/element';

import {
	compose,
	withInstanceId,
} from '@wordpress/compose';

import {
	HorizontalRule,
} from '@wordpress/components';

import {
	InspectorControls,
	withColors,
	PanelColorSettings,
} from '@wordpress/block-editor';

class SeparatorEdit extends Component {
	render() {
		const {
			backgroundColor,
			setBackgroundColor,
			className,
		} = this.props;
		return (
			<div>
				<HorizontalRule
					className={ classnames(
						className, {
							'has-background': backgroundColor.color,
							[ backgroundColor.class ]: backgroundColor.class,
						}
					) }
					style={ {
						borderColor: backgroundColor.color,
						color: backgroundColor.color,
					} }
				/>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						colorSettings={ [
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background Color' ),
							},
						] }
					>
					</PanelColorSettings>
				</InspectorControls>
			</div>
		);
	}
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
] )( SeparatorEdit );
