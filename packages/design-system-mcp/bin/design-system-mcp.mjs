#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/server';
import { createServer } from '@wordpress/design-system-mcp';

const transport = new StdioServerTransport();
const server = createServer();

await server.connect( transport );
