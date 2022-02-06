import fastglob from 'fast-glob';
import * as pathlib from 'path';
import {createHash} from 'crypto';
import * as cache from '@actions/cache';

import type {Cache} from './cache.js';

export class GitHubCache implements Cache {
  async getOutputs(
    packageJsonPath: string,
    taskName: string,
    cacheKey: string,
    taskOutputGlobs: string[]
  ): Promise<GitHubCachedOutput | undefined> {
    if (taskOutputGlobs === undefined) {
      // Cache API requires at least one path.
      return undefined;
    }
    const packageRoot = pathlib.dirname(packageJsonPath);
    const paths = await fastglob(taskOutputGlobs, {
      cwd: packageRoot,
      absolute: true,
    });
    // TODO(aomarks) Is packageJsonPath reliable?
    const key = `${packageJsonPath}:${taskName}:${hashCacheKey(cacheKey)}`;
    // TODO(aomarks) @actions/cache doesn't let us just test for a cache hit, so
    // we apply immediately and the output object is a no-op. The underlying
    // library does. But what we really want is a separate manifest cache item
    // that we can apply to a virtual fielsystem.
    await cache.restoreCache(paths, key);
    return new GitHubCachedOutput();
  }

  async saveOutputs(
    packageJsonPath: string,
    taskName: string,
    cacheKey: string,
    taskOutputGlobs: string[]
  ): Promise<void> {
    if (taskOutputGlobs === undefined) {
      // Cache API requires at least one path.
      return undefined;
    }
    const packageRoot = pathlib.dirname(packageJsonPath);
    const paths = await fastglob(taskOutputGlobs, {
      cwd: packageRoot,
      absolute: true,
    });
    // TODO(aomarks) Is packageJsonPath reliable?
    const key = `${packageJsonPath}:${taskName}:${hashCacheKey(cacheKey)}`;
    console.log('CACHING', {key, paths});
    await cache.saveCache(paths, key);
  }
}

const hashCacheKey = (key: string): string =>
  createHash('sha256').update(key).digest('hex');

class GitHubCachedOutput {
  async apply(): Promise<void> {}
}