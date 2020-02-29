/**
 * Internal dependencies
 */
import Text from './text';

// Let's make some waves!
// We can add attributes to our block, and get and set them in the edit function

const SurfEdit = ( { attributes, setAttributes } ) => {
	const { waveHeight } = attributes;

	return <Text>Wave height: { waveHeight } ft</Text>;
};
export default SurfEdit;
