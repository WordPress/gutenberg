import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Text } from '../text';
import type { MenuGroupLabelProps } from './types';
import styles from './styles.module.css';

const GroupLabel = forwardRef< HTMLDivElement, MenuGroupLabelProps >(
	( { className, ...props }, ref ) => (
		<Text
			ref={ ref }
			variant="body-sm"
			render={ <BaseMenu.GroupLabel { ...props } /> }
			className={ clsx( styles.groupLabel, className ) }
		/>
	)
);
GroupLabel.displayName = 'Menu.GroupLabel';

export { GroupLabel };
