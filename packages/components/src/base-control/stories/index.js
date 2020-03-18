/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import BaseControl from '../';

export default { title: 'Components/BaseControl', component: BaseControl };

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
			<textarea id={ id } />
		</BaseControl>
	);
};

export const fieldset = () => {
	const id = text( 'Id', 'fieldset-1' );
	const radioId1 = 'public';
	const radioId2 = 'private';
	const radioId3 = 'password';

	return (
		<BaseControl label="Post visibility" as="fieldset" id={ id }>
			<input type="radio" id={ radioId1 } name="post-visibility" />
			<label htmlFor={ radioId1 }>Public</label><br />

			<input type="radio" id={ radioId2 } name="post-visibility" />
			<label htmlFor={ radioId2 }>Private</label><br />

			<input type="radio" id={ radioId3 } name="post-visibility" />
			<label htmlFor={ radioId3 }>Password Protected</label><br />
		</BaseControl>
	);
};
