/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import BaseControl from '../';

export default { title: 'Components|BaseControl', component: BaseControl };

export const _default = () => {
	const id = text( 'Id', 'textarea-1' );
	const label = text( 'Label', 'Label text' );
	const hideLabelFromVision = boolean( 'Hide label from vision', false );
	const help = text( 'Help', 'Help text' );
	const className = text( 'ClassName', '' );

	return (
		<BaseControl
			id={ id }
			label={ label }
			help={ help }
			hideLabelFromVision={ hideLabelFromVision }
			className={ className }
		>
			<textarea
				id={ id }
			/>
		</BaseControl>
	);
};
