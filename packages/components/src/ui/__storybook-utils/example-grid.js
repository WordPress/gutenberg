/**
 * Internal dependencies
 */
import { Grid } from '../grid';
import { Surface } from '../surface';
import Text from '../../text';
import { View } from '../view';
import { VStack } from '../v-stack';

const Container = ( { children } ) => (
	<div
		style={ {
			maxWidth: 1280,
			width: '100%',
			marginLeft: 'auto',
			marginRight: 'auto',
		} }
	>
		{ children }
	</div>
);

export const ExampleGrid = ( { children } ) => (
	<Container>
		<Grid columns={ [ 2, 2, 4 ] } gap="1px">
			{ children }
		</Grid>
	</Container>
);

export const ExampleGridItem = ( { children } ) => (
	<Surface
		variant="secondary"
		style={ {
			padding: 20,
		} }
	>
		<VStack alignment="center">{ children }</VStack>
	</Surface>
);

export const ExampleMetaContent = ( { title, items = [] } ) => {
	return (
		<Grid templateColumns="60px 1fr">
			<View>
				<Text size="caption" weight="bold" align="right" isBlock>
					{ title }
				</Text>
			</View>
			<VStack spacing={ 1 }>
				{ items.map( ( item, index ) => (
					<View key={ index }>
						<Text size="caption" isBlock>
							{ item }
						</Text>
					</View>
				) ) }
			</VStack>
		</Grid>
	);
};
