# Releasing QPEF

1. Increase `versionCode` and set the corresponding `version` in `module.prop`.
2. Update `CHANGELOG.md`, commit, and push `main`.
3. Optionally run **Build and release QPEF Magisk module** manually to download a test ZIP.
4. Tag the committed `main` state with the exact version, then push the tag. The workflow builds the native library, packs the Magisk ZIP, creates a GitHub Release, and updates `update.json` on `main`.

For the initial v1.0 release, the manifest already describes v1.0. Publishing the tag creates its ZIP asset. The repository must permit GitHub Actions to write to `main` for later manifest updates.
