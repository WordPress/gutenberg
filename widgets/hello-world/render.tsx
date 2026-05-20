/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './render.module.css';

export default function HelloWorld() {
	return (
		<Stack
			className={ clsx( styles.root, styles.brand ) }
			align="center"
			justify="center"
		>
			<Text variant="heading-2xl">Hello World</Text>
		</Stack>
	);
}
