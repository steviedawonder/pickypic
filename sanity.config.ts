import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemas';
import { seoStructure } from './src/sanity/structure';

export default defineConfig({
  name: 'pickypic-admin',
  title: 'PICKYPIC 관리자',
  projectId: '7b9lcco4',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: seoStructure,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
