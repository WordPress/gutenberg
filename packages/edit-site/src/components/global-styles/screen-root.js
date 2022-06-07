/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	CardBody,
	Card,
	CardMedia,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ContextMenu from './context-menu';
import StylesPreview from './preview';

function ScreenRoot() {
	return (
		<Card size="small">
			<CardBody>
				<VStack spacing={ 4 }>
					<Card>
						<CardMedia>
							<StylesPreview />
						</CardMedia>
					</Card>
					<ContextMenu />
				</VStack>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
