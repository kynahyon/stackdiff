/**
 * Parser module for stackdiff.
 * Provides utilities for parsing and extracting dependency information
 * from package lock files.
 */

export {
  parseLockfile,
  extractDependencies,
} from './lockfile';

export type {
  PackageLock,
  PackageEntry,
  ParsedDependency,
} from './lockfile';
