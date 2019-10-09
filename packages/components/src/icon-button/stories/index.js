/**
 * Internal dependencies
 */
import IconButton from '../';

export default { title: 'IconButton', component: IconButton };

export const _default = () => <IconButton icon="ellipsis" label="More" />;

export const Grouped = () => {
	const GroupContainer = ( props ) => (
		<div style={ { display: 'inline-flex' } } { ...props } />
	);

	return (
		<GroupContainer>
			<IconButton icon="editor-bold" label="Bold" />
			<IconButton icon="editor-italic" label="Italic" />
			<IconButton icon="editor-underline" label="Underline" />
		</GroupContainer>
	);
};
