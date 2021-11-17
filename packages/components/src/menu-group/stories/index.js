/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { MenuGroup } from '../';

export default {
	title: 'Components/MenuGroup',
	component: MenuGroup,
	parameters: {
		knobs: { disabled: false },
	},
};

export const _default = () => {
	const label = text( 'Label', 'MenuGroup label text' );
	const hideSeparator = boolean( 'Hide top border separator', false );
	const className = text( 'ClassName', 'menu-group-story' );

	return (
		<MenuGroup
			hideSeparator={ hideSeparator }
			label={ label }
			className={ className }
		>
			<p>MenuGroup item</p>
		</MenuGroup>
	);
};
