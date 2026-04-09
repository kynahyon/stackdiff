import { main } from './cli';

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
