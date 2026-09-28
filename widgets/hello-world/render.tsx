import clsx from 'clsx';
import { Stack, Text } from '@wordpress/ui';
import styles from './style.module.css';

interface HelloWorldAttributes {
	message?: string;
}

type HelloWorldRenderProps = {
	attributes?: HelloWorldAttributes;
};

export default function HelloWorld( { attributes }: HelloWorldRenderProps ) {
	return (
		<Stack
			align="center"
			justify="center"
			className={ clsx( styles.root ) }
		>
			<Text variant="heading-2xl">
				{ attributes?.message || 'Hello World' }
			</Text>
		</Stack>
	);
}
