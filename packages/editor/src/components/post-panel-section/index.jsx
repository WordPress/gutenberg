import clsx from 'clsx';
import { __experimentalVStack as VStack } from '@wordpress/components';

function PostPanelSection( { className, children } ) {
	return (
		<VStack className={ clsx( 'editor-post-panel__section', className ) }>
			{ children }
		</VStack>
	);
}

export default PostPanelSection;
