/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { HorizontalRule } from '@wordpress/components';
import { withColors } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';

function SeparatorEdit( { color, setColor, className } ) {
	return (
		<>
			<HorizontalRule
				className={ classnames( className, {
					'has-background': color.color,
					[ color.class ]: color.class,
				} ) }
				style={ {
					backgroundColor: color.color,
					color: color.color,
				} }
			/>
			<SeparatorSettings color={ color } setColor={ setColor } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
