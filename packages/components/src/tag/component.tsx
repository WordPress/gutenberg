/**
 * External dependencies
 */
import { css, cx } from 'emotion';
import { noop } from 'lodash';
// eslint-disable-next-line no-restricted-imports
import type { ReactNode, CSSProperties, Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../ui/context';
import { Text } from '../text';
import * as styles from './styles';
import { TAG_COLORS } from './utils';
import TagRemoveButton from './remove-button';
const { TagView } = styles;

export type Props = {
	children: ReactNode;
	color?: keyof typeof TAG_COLORS;
	display?: CSSProperties[ 'display' ];
	onRemove?: () => void;
	removeButtonText?: string;
};

function Tag(
	props: PolymorphicComponentProps< Props, 'span' >,
	forwardedRef: Ref< any >
) {
	const {
		children,
		color = 'standard',
		display = 'inline-flex',
		onRemove = noop,
		removeButtonText,
		className,
		...otherProps
	} = useContextSystem( props, 'Tag' );
	const tagColor = TAG_COLORS[ color ] || TAG_COLORS.standard;

	const classes = cx(
		css( { display } ),
		styles.getBackground( { color: tagColor } ),
		styles.getBackgroundText( { color: tagColor } ),
		className
	);

	return (
		<TagView
			as="span"
			{ ...otherProps }
			className={ classes }
			ref={ forwardedRef }
		>
			<Text
				className={ styles.text }
				color="currentColor"
				isBlock
				lineHeight={ 1 }
				truncate
			>
				{ children }
			</Text>
			<TagRemoveButton
				onClick={ onRemove }
				removeButtonText={ removeButtonText }
			/>
		</TagView>
	);
}

export default contextConnect( Tag, 'Tag' );
