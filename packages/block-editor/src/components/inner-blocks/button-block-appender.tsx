import type { ComponentProps, ComponentType } from 'react';
import clsx from 'clsx';
import UntypedButtonBlockAppender from '../button-block-appender';
import { useBlockEditContext } from '../block-edit/context';
import type { InnerBlocksButtonBlockAppenderProps } from './types';

// The appender is still JavaScript, so its inferred props are all required.
const BaseButtonBlockAppender = UntypedButtonBlockAppender as ComponentType<
	Partial< ComponentProps< typeof UntypedButtonBlockAppender > >
>;

export default function ButtonBlockAppender( {
	showSeparator,
	isFloating,
	onAddBlock,
	isToggle,
}: InnerBlocksButtonBlockAppenderProps ) {
	const { clientId } = useBlockEditContext();
	return (
		<BaseButtonBlockAppender
			className={ clsx( {
				'block-list-appender__toggle': isToggle,
			} ) }
			rootClientId={ clientId }
			// @ts-expect-error The appender ignores `showSeparator`, `isFloating` and `onAddBlock`.
			showSeparator={ showSeparator }
			isFloating={ isFloating }
			onAddBlock={ onAddBlock }
		/>
	);
}
