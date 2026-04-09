import { main } from './cli';

/**
 * Entry point for the stackdiff CLI application.
 * Handles uncaught errors and ensures proper exit codes.
 */
main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
