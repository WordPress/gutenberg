import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Match the CommonJS `yargs` entry point, which is initialized with argv.
export default yargs( hideBin( process.argv ) );
