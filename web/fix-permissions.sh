#!/bin/bash
# Remove macOS extended attributes that block file access
xattr -rc node_modules 2>/dev/null || true

