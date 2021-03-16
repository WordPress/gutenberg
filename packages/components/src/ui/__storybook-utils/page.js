/**
 * External dependencies
 */
import { Container, Divider, Heading } from '@wp-g2/components';
/**
 * Internal dependencies
 */
import { VStack } from '../v-stack';
import { View } from '../view';

function Page( { title = 'Component', children } ) {
	return (
		<Container css={ { paddingTop: 24, paddingBottom: '20vh' } }>
			<VStack spacing={ 6 }>
				<Heading size={ 1 }>{ title }</Heading>
				<Divider />
				<View>{ children }</View>
			</VStack>
		</Container>
	);
}

export default Page;
