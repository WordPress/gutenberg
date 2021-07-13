/**
 * External dependencies
 */
import { motion } from 'framer-motion';
import ReactJson from 'react-json-view';

/**
 * WordPress dependencies
 */
import {
	Card,
	CardBody,
	CardHeader,
	Panel,
	PanelBody,
	PanelHeader,
	SelectControl,
	useNavigatorHistory,
	useNavigatorLocation,
	__experimentalView as View,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useAppState } from '../state';

const routes = [
	'/',
	'/colors',
	'/colors/palette',
	'/colors/elements/background',
	'/typography',
	'/typography/elements/headings',
].map( ( o ) => ( {
	value: o,
	label: o,
} ) );

export const Inspector = () => {
	const navigator = useNavigatorHistory();
	const location = useNavigatorLocation();
	const currentPath = location?.pathname;
	const handleOnRouteChange = ( next ) => navigator.push( next );
	const appState = useAppState();

	return (
		<div style={ { position: 'fixed', top: 16, left: 16 } }>
			<motion.div drag dragMomentum={ false }>
				<Card css={ { minWidth: 400 } } size="small">
					<CardHeader size="small">Inspector</CardHeader>
					<CardBody>
						<SelectControl
							onChange={ handleOnRouteChange }
							options={ routes }
							value={ currentPath }
							label="Go to"
							labelPosition="side"
						/>
					</CardBody>
					<Panel>
						<PanelHeader>State</PanelHeader>
						<PanelBody>
							<View
								css={ {
									fontFamily: 'monospace',
									maxWidth: '100%',
									maxHeight: 300,
									overflowY: 'auto',
									fontSize: 12,
									lineHeight: 1,
								} }
							>
								<ReactJson
									displayDataTypes={ false }
									displayObjectSize={ false }
									enableClipboard={ false }
									src={ JSON.parse(
										JSON.stringify( appState, null, 2 )
									) }
								/>
							</View>
						</PanelBody>
					</Panel>
				</Card>
			</motion.div>
		</div>
	);
};
