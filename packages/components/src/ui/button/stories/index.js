/**
 * Internal dependencies
 */
import { Flex, Text } from '../..';
import { Button } from '..';

export default {
	component: Button,
	title: 'G2 Components (Experimental)/Button',
};

const Buttons = ( props ) => {
	return (
		<Flex direction="row" justify="left" spacing={ 4 }>
			<Text size={ 12 } variant="muted">
				Large
			</Text>
			<Button size="large" { ...props }>
				Button
			</Button>
			<Text size={ 12 } variant="muted">
				Medium
			</Text>
			<Button size="medium" { ...props }>
				Button
			</Button>
			<Text size={ 12 } variant="muted">
				Small
			</Text>
			<Button size="small" { ...props }>
				Button
			</Button>
		</Flex>
	);
};

export const _default = () => {
	return (
		<>
			<Buttons variant="primary" />
			<Buttons variant="secondary" />
			<Buttons variant="tertiary" />
			<Buttons isDestructive variant="primary" />
			<Buttons isDestructive variant="secondary" />
			<Buttons isDestructive variant="tertiary" />
			<Buttons isSubtle variant="secondary" />
			<Buttons isControl />
			<Buttons isControl isSubtle />
			<Buttons
				elevation={ 2 }
				prefix={ <Text>Prefix</Text> }
				suffix={ <Text>Suffix</Text> }
				variant="secondary"
			/>
			<Buttons
				elevation={ 2 }
				isLoading
				prefix={ <Text>Prefix</Text> }
				suffix={ <Text>Suffix</Text> }
				variant="secondary"
			/>
		</>
	);
};
