import { createRegistry } from './registry';

const registry = createRegistry();

registry.use( 'persistence' );

export default registry;
