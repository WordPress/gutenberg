/**
 * Internal dependencies
 */
import { VStack } from '../v-stack';
import { View } from '../view';
import Heading from '../../heading';
import { Divider } from '../divider';

function Page( { title = 'Component', children } ) {
	return (
		<div
			style={ {
				paddingTop: 24,
				paddingBottom: '20vh',
				maxWidth: '1280px',
				marginLeft: 'auto',
				marginRight: 'auto',
			} }
		>
			<VStack spacing={ 6 }>
				<Heading size={ 1 }>{ title }</Heading>
				<Divider />
				<View>{ children }</View>
			</VStack>
		</div>
	);
}

export default Page;
