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
import styles from './style.module.css';

export default function HelloWorld() {
	return (
		<Stack
			align="center"
			justify="center"
			className={ clsx( styles.root ) }
		>
			<Text variant="heading-2xl">Hello World</Text>
		</Stack>
	);
}
