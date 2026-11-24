import type { FocusEventHandler, ForwardedRef } from 'react';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';
import {
	BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU,
	useAddSubmenuLink,
} from './use-add-submenu-link';
import type { ListViewCallbacks } from './use-add-submenu-link';

const { ListViewBlockAppender, useBlockDisplayTitle } = unlock(
	blockEditorPrivateApis
);

/**
 * Whether a Navigation List View row that can take inner blocks gets a +.
 * A link takes inner blocks only so that it can become a submenu, which its
 * "Add submenu link" option does, so it gets none. An empty submenu still
 * gets one.
 *
 * @param blockName The row's block name.
 */
export function hasNavigationBlockAppender( blockName: string ) {
	return blockName !== 'core/navigation-link';
}

type LeafAppenderProps = ListViewCallbacks & {
	clientId: string;
	tabIndex?: number;
	onFocus?: FocusEventHandler;
};

/**
 * The + in a Navigation List View row. A link or a submenu gets a new link
 * the way "Add submenu link" adds one: a link becomes a submenu before the new
 * link goes into it, so the new link's Link UI mounts only once. Any other
 * block gets the List View's own +.
 *
 * @param props The row's block and the List View's callbacks.
 * @param ref   The button's ref.
 */
function LeafAppender(
	props: LeafAppenderProps,
	ref: ForwardedRef< HTMLButtonElement >
) {
	const {
		clientId,
		tabIndex,
		onFocus,
		updateExpansion,
		setInsertedBlockClientId,
	} = props;
	const blockName = useSelect(
		( select ) => select( blockEditorStore ).getBlockName( clientId ),
		[ clientId ]
	);
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const addSubmenuLink = useAddSubmenuLink( clientId, {
		updateExpansion,
		setInsertedBlockClientId,
	} );

	if (
		! blockName ||
		! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes( blockName )
	) {
		return <ListViewBlockAppender ref={ ref } { ...props } />;
	}

	return (
		<Button
			ref={ ref }
			className="block-editor-list-view-block__appender"
			icon={ plus }
			size="small"
			label={ sprintf(
				/* translators: %s: The name of the block that the new block is added to. */
				__( 'Add to %s' ),
				blockTitle
			) }
			tabIndex={ tabIndex }
			onFocus={ onFocus }
			onClick={ addSubmenuLink }
		/>
	);
}

export default forwardRef( LeafAppender );
