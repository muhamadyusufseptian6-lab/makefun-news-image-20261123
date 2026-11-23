// main.ts — news-image-20261123 entry (Node 22, standard library only).
// The image is entry.png beside this file; the program copies it to the output
// directory as entry.png. No network, no re-encoding: both runs write the
// same bytes, byte for byte.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// MAKEFUN_INPUT_DIR names the directory holding entry.png (the repository
// root by default); MAKEFUN_OUTPUT_DIR stands in for /output.
const inDir = process.env.MAKEFUN_INPUT_DIR ?? new URL('.', import.meta.url).pathname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(join(inDir, 'entry.png'), join(outDir, 'entry.png'));
