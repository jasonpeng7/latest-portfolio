# Previous portfolio archive

This folder preserves the original committed portfolio before the 3D revamp.

- Source commit: `332d513b671717230488883a1b9fc5dc887cf725`
- Commit date: April 23, 2026
- Commit description: `removed projects in prod view for now`
- Snapshot created: October 5, 2026

All 84 tracked files were exported directly from that commit, including the
original source, public images, package.json, and configuration. The original
README and files remain unchanged. This note is the only extra file.
Untracked dependencies, build output, environment files, and Git internals
are not part of the snapshot.

The archive is outside the current application's `src` and `public` directories
and excluded from its linting and JavaScript project indexing. It is not a live
route or part of the current application's runtime. It occupies about 55 MiB
of additional checkout space; Git can reuse the original file objects.

To preview the previous site independently, copy this folder outside the current
project, install its dependencies, and run it on a separate port:

```sh
cp -R prev-site-archive ../previous-portfolio-preview
cd ../previous-portfolio-preview
npm install
npm run dev -- --port 3001
```
